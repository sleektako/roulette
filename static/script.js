// Global Variable to track mode
let isNSFW = false;

function toggleNSFW() {
    const btn = document.getElementById('nsfw-btn');
    isNSFW = !isNSFW; 

    if (isNSFW) {
        // Use innerHTML TO NOT lose the <span>indicator</span>
        btn.innerHTML = '<span class="indicator"></span> WARNING_NSFW';
        btn.className = "mode-btn nsfw";
    } else {
        btn.innerHTML = '<span class="indicator"></span> SAFE_PROTOCOL';
        btn.className = "mode-btn safe";
    }
}

async function startSpin() {
    const btn = document.getElementById('spin-btn');
    const container = document.getElementById('image-container');
    const actions = document.getElementById('actions');
    const tagsArea = document.getElementById('tags-area'); 
    const tagsList = document.getElementById('tags-list'); 
    
    const addedTags = document.getElementById('add-tags').value;
    const blockedTags = document.getElementById('block-tags').value;

    btn.disabled = true;
    
    // 1. SEARCHING PHASE (The Dot Animation)
    // Manually write the dots with spans to animate them
    btn.innerHTML = `
        <span class="btn-text">SCANNING_DATABASE<span class="anim-dots">...</span></span> 
        <span class="btn-deco">///</span>
    `;
    
    actions.classList.add('hidden');
    tagsArea.classList.add('hidden'); 
    
    // Show simple text in box while searching API
    container.innerHTML = '<span class="placeholder blink">CONNECTING...</span>';
    
    try {
        const query = `/spin?added=${encodeURIComponent(addedTags)}&blocked=${encodeURIComponent(blockedTags)}&nsfw=${isNSFW}`;
        const response = await fetch(query);
        const data = await response.json();
        
        if (data.success) {
            console.log("Loading:", data.url);
            
            // 2. DOWNLOADING PHASE (The Image Loader)
            // The API found a match, but the image hasn't loaded yet.
            // Show the Tactical Spinner!
            container.innerHTML = `
                <div class="loading-wrapper">
                    <div class="tech-loader"></div>
                    <div>DOWNLOADING_ASSET</div>
                </div>
            `;
            
            const img = new Image();
            img.referrerPolicy = "no-referrer";
            img.src = data.url;
            
            // When laoding heavy image:
            img.onload = () => {
                container.innerHTML = ''; 
				img.className = "clickable-zoom"; // Add cursor style
                img.onclick = () => {
                    openModal(data.url); // Click triggers the modal!
                };
                container.appendChild(img); // Show the image!
                
                // ... (The rest of existing code for Stats/Links) ...
                document.getElementById('source-link').href = data.source_link;
                document.getElementById('download-link').href = `/download?url=${encodeURIComponent(data.url)}`;
                actions.classList.remove('hidden'); 
                
                // STATS POPULATION (Keep existing code here!)
                const stats = data.stats;
                document.getElementById('stat-id').innerText = stats.id;
                document.getElementById('stat-date').innerText = stats.posted;
                document.getElementById('stat-uploader').innerText = stats.uploader;
                document.getElementById('stat-size').innerText = stats.size;
                document.getElementById('stat-score').innerText = stats.score;
                
                const sourceEl = document.getElementById('stat-source');
                if (stats.source && stats.source.startsWith('http')) {
                    sourceEl.href = stats.source;
                    sourceEl.innerText = "ACCESS_LINK";
                    sourceEl.style.pointerEvents = "auto";
                    sourceEl.style.color = "#F2D930";
                } else {
                    sourceEl.href = "#";
                    sourceEl.innerText = "NULL";
                    sourceEl.style.pointerEvents = "none";
                    sourceEl.style.color = "#666";
                }

                let ratingText = "UNKNOWN";
                if (stats.rating === 's' || stats.rating === 'g') ratingText = "SAFE_CLASS";
                else if (stats.rating === 'q') ratingText = "CAUTION_CLASS";
                else if (stats.rating === 'e') ratingText = "DANGER_CLASS";
                document.getElementById('stat-rating').innerText = ratingText;

                document.getElementById('stats-box').classList.remove('hidden');

                // TAGS (Keep existing code here!)
                tagsList.innerHTML = ''; 
                const tagsArray = data.tags.split(" "); 
                tagsArray.forEach(tag => {
                    const tagBtn = document.createElement("span");
                    tagBtn.innerText = tag;
                    tagBtn.className = "tag-chip";
                    tagBtn.onclick = () => {
                        const inputBox = document.getElementById('add-tags');
                        if (!inputBox.value.includes(tag)) {
                            inputBox.value += (inputBox.value ? " " : "") + tag;
                            tagBtn.style.background = "#F2D930";
                            tagBtn.style.color = "#000";
                        }
                    };
                    tagsList.appendChild(tagBtn);
                });
                tagsArea.classList.remove('hidden'); 

                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">RE-INITIALIZE SCAN</span> <span class="btn-deco">>>></span>';
            };

            img.onerror = () => {
                container.innerHTML = '<span class="placeholder">ERR_403</span>';
                alert("Image blocked by host.");
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">RETRY_CONNECTION</span> <span class="btn-deco">!</span>';
            };

        } else {
            container.innerHTML = '<span class="placeholder">NULL</span>';
            alert("Error: " + data.error);
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">RETRY_CONNECTION</span> <span class="btn-deco">!</span>';
        }

    } catch (error) {
        console.error(error);
        btn.disabled = false;
        btn.innerText = "FATAL_ERROR";
    }
}

// --- MODAL CONTROLS ---

function openModal(url) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    
    modal.classList.remove('hidden');
    modalImg.src = url;
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
    
    // Clear source so it doesn't flash the old image next time
    setTimeout(() => {
        document.getElementById('modal-img').src = '';
    }, 200);
}
