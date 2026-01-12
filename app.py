from flask import Flask, render_template, jsonify, request, send_file, session, redirect, url_for
import requests
import random
import io
import os

app = Flask(__name__)

# SECURITY KEY: Needed to encrypt cookies
# In a real app, this should be a long random string.
app.secret_key = "ENDFIELD_INDUSTRIES_TOP_SECRET_PROTOCOL"

# ROUTE: LOGIN PAGE
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Save the keys into the browser's Session
        session['user_id'] = request.form.get('user_id')
        session['api_key'] = request.form.get('api_key')
        return redirect(url_for('home'))
    
    return render_template('login.html')

# ROUTE: LOGOUT
@app.route('/logout')
def logout():
    session.clear() # Wipe the memory
    return redirect(url_for('login'))

# ROUTE: HOME
@app.route('/')
def home():
    # If we don't have keys, kick them back to the login screen!
    if 'user_id' not in session or 'api_key' not in session:
        return redirect(url_for('login'))
    
    return render_template('index.html')

@app.route('/spin')
def spin_roulette():
    # Retrieve keys from Session
    USER_ID = session.get('user_id')
    API_KEY = session.get('api_key')

    if not USER_ID or not API_KEY:
        return jsonify({"success": False, "error": "AUTH_ERROR: Please Log In."})

    user_added = request.args.get('added', '')
    user_blocked = request.args.get('blocked', '')
    is_nsfw = request.args.get('nsfw', 'false') == 'true'

    base_tags = [] 
    if is_nsfw:
        base_blocked = [] 
    else:
        base_blocked = ["rating:explicit", "rating:questionable", "gore", "scat"]

    all_tags = base_tags + user_added.split()
    all_blocked = base_blocked + user_blocked.split()

    tags_string = " ".join(all_tags)
    blocked_string = " ".join(["-" + t for t in all_blocked])
    
    if not tags_string:
        tags_string = "sort:random" 

    final_query = f"{tags_string} {blocked_string}"
    
    url = "https://gelbooru.com/index.php"
    
    try:
        # Get Count
        count_params = {
            "page": "dapi", "s": "post", "q": "index", "json": 1, "limit": 0, 
            "tags": final_query, "api_key": API_KEY, "user_id": USER_ID
        }
        
        count_response = requests.get(url, params=count_params)
        count_data = count_response.json()
        
        total_posts = 0
        if '@attributes' in count_data:
            total_posts = int(count_data['@attributes']['count'])
        elif 'post' in count_data:
            total_posts = len(count_data['post'])

        if total_posts == 0:
             return jsonify({"success": False, "error": "NO_DATA_FOUND"})

        max_limit = min(total_posts, 20000) 
        random_pid = random.randint(0, max_limit - 1)

        # Fetch
        fetch_params = {
            "page": "dapi", "s": "post", "q": "index", "json": 1, "limit": 1,
            "pid": random_pid, "tags": final_query, "api_key": API_KEY, "user_id": USER_ID
        }

        response = requests.get(url, params=fetch_params)
        data = response.json()

        if 'post' in data and len(data['post']) > 0:
            post = data['post'][0]
            return jsonify({
                "success": True, 
                "url": post['file_url'],
                "source_link": f"https://gelbooru.com/index.php?page=post&s=view&id={post['id']}",
                "tags": post.get('tags', ''),
                "stats": {
                    "id": post.get('id', 'Unknown'),
                    "posted": post.get('created_at', 'Unknown'),
                    "uploader": post.get('owner', 'Unknown'),
                    "size": f"{post.get('width', '?')}x{post.get('height', '?')}",
                    "source": post.get('source', 'Unknown'),
                    "rating": post.get('rating', '?'),
                    "score": post.get('score', 0)
                }
            })
        else:
            return jsonify({"success": False, "error": "SCAN_FAILED: Empty Result"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/download')
def download_image():
    img_url = request.args.get('url')
    original_filename = img_url.split('/')[-1]
    try:
        r = requests.get(img_url)
        return send_file(
            io.BytesIO(r.content), 
            mimetype='image/jpeg', 
            as_attachment=True, 
            download_name=original_filename
        )
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    app.run(debug=True)