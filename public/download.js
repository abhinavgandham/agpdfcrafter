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
        // } else {
        //     // Fallback to local API (for backward compatibility)
        //     console.log('Using local API fallback:', downloadUrl);
        //     const token = localStorage.getItem('token');
            
        //     const response = await fetch(`/api/file/download/${downloadUrl}`, {
        //         method: 'GET',
        //         headers: {
        //             'Authorization': `Bearer ${token}`
        //         }
        //     });

        //     if (response.ok) {
        //         const data = await response.json();
                
        //         if (data.downloadUrl) {
        //             // S3 presigned URL from API - redirect to it
        //             showDownloadMessage('⬇️ Redirecting to download...');
        //             window.open(data.downloadUrl, '_blank');
        //             showDownloadMessage('✅ Download started!');
        //         } else {
        //             // Local file download
        //             const blob = await response.blob();
        //             const url = window.URL.createObjectURL(blob);
        //             const a = document.createElement('a');
        //             a.style.display = 'none';
        //             a.href = url;
        //             a.download = downloadUrl;
        //             document.body.appendChild(a);
        //             a.click();
        //             window.URL.revokeObjectURL(url);
        //             document.body.removeChild(a);
        //             showDownloadMessage('✅ Download completed!');
        //         }
        //     } else {
        //         const errorData = await response.json();
        //         showDownloadMessage(`❌ Download failed: ${errorData.message || 'Unknown error'}`);
        //     }
        // }
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