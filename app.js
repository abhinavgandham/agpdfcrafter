const express = require('express');
const swaggerUI = require('swagger-ui-express');
const env = require('dotenv')
const authRoutes = require('./src/routes/authRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const userRoutes = require('./src/routes/userRoutes');
const fs = require('fs');
const path = require('path');
const loadSwaggerDocument = require('./src/swagger.js');
const { createBucket, tagBucket } = require('./src/cloudservices/bucket.js');
const app = express();

env.config();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/file', fileRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/user', userRoutes);

// Initialize S3 bucket on startup
createBucket().then(result => {
    if (result.success) {
        console.log('S3 bucket initialization:', result.message);
    } else {
        console.error('S3 bucket initialization failed:', result.error);
    }
}).catch(error => {
    console.error('Unexpected error during bucket initialization:', error);
});

// Tag S3 bucket on startup
tagBucket().then(result => {
    if (result.success) {
        console.log('S3 bucket tagging:', result.message);
    } else {
        console.error('S3 bucket tagging failed:', result.error);
    }
}).catch(error => {
    console.error('Unexpected error during bucket tagging:', error);
});

// Load the swagger document and set up the UI
const swaggerDocument = loadSwaggerDocument();
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
