const downloadMessageArea = document.querySelector('#downloadMessage');

const download = async (filename) => {
    const token = localStorage.getItem('token');

    if (!filename) {
        showDownloadMessage('❌ No filename provided for download');
        return;
    }

    try {
        downloadMessageArea.textContent = '⬇️ Downloading...';

        const response = await fetch(`/api/file/download/${filename}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Create a blob from the response
            const blob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showDownloadMessage('✅ Download completed!');
        } else {
            const errorData = await response.json();
            showDownloadMessage(`❌ Download failed: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Download error:', error);
        showDownloadMessage('❌ Network error during download');
    }
}

const showDownloadMessage = (message) => {
    downloadMessageArea.textContent = message;
    setTimeout(() => {
        downloadMessageArea.textContent = "";
    })
}

// Initialize download functionality
document.addEventListener('DOMContentLoaded', () => {
    // Set up event delegation for download buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'downloadBtn') {
            e.preventDefault();
            const filename = e.target.getAttribute('data-filename');
            if (filename) {
                download(filename);
            }
        }
    });
});