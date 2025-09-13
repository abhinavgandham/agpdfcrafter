const downloadMessageArea = document.querySelector('#downloadMessage');


const download = async (downloadUrl) => {
    if (!downloadUrl) {
        showDownloadMessage('❌ No download URL provided');
        return;
    }

    try {
        downloadMessageArea.textContent = '⬇️ Starting download...';
        console.log('Using S3 presigned URL:', downloadUrl);
        showDownloadMessage('⬇️ Downloading...');
        window.open(downloadUrl, '_blank');
        showDownloadMessage('✅ Download started!');
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
            const downloadUrl = e.target.getAttribute('data-download-url');
            if (downloadUrl) {
                download(downloadUrl);
            }
        }
    });
});