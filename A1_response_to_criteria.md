Assignment 1 - REST API Project - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Abhinav Gandham
- **Student number:** n11795611
- **Application name:** PDF Converter Application
- **Two line description:** This is a pdf converter application that supports the coversion of html, md, and docx files to pdf. Users can also view their conversion jobs that have been executed.


Core criteria
------------------------------------------------

### Containerise the app

- **ECR Repository name:**n11795611-abhinavgandham-cab432-app
- **Video timestamp:**00:00 - 00:30
- **Relevant files:**
    - Dockerfile
    - docker-compose.yml

### Deploy the container

- **EC2 instance ID:**i-0f597777aa6a959d4
- **Video timestamp:**00:00 - 00:30

### User login

- **One line description:** Hard coded JSON user list with two users. Using JWT authentication.
- **Video timestamp:**6:35
- **Relevant files:**
    - users.json
    - src/controllers/loginController.js
    - public/login.js

### REST API

- **One line description:**REST API with GET and POST endpoints as well as appropriate status codes.
- **Video timestamp:**4:00 - 5:14
- **Relevant files:**
    - app.js
    - src/controllers
    - src/middleware
    - src/routes
    - src/docs/swagger.yml

### Data types

- **One line description:** Two kinds of datatypes: Files and file metadata with user info for jobs.
- **Video timestamp:**
- **Relevant files:**
    - src/controllers/loginController.js
    - src/controllers/uploadController.js
    - src/controllers/conversionControlller.js
    - src/controllers/downloadController.js
    - src/jobController.js
    - public/jobs.js

#### First kind

- **One line description:** Files (pdf)
- **Type:** Unstructured
- **Rationale:** These files are too large to store in databases.
- **Video timestamp:**4:40
- **Relevant files:**
    - src/uploadController.js
    - src/conversionController.js
    - src/downloadControlller.js
    - src/middleware/fileUpload.js
    - src/middleware/fileConvert.js

#### Second kind

- **One line description:**File metadata with user information for jobs.
- **Type:**Structured
- **Rationale:**Need to be retrieve information about conversion jobs.
- **Video timestamp:**4:15, 4:50
- **Relevant files:**
  - src/jobController.js
  - src/middleware/fileUpload.js
  - src/middleware/fileConvert.js

### CPU intensive task

 **One line description:**PDF conversion using puppeteer for html/md files and mammoth for docx files.
- **Video timestamp:**1:45
- **Relevant files:**
    - src/controllers/conversionController.js
    - src/middleware/fileConvert.js
    - public/convert.js

### CPU load testing

 **One line description:**Used a manual method for load testing. Submitted 3 cpu intensive tasks.
- **Video timestamp:**5:15
- **Relevant files:**
    - src/controllers/conversionController.js
    - src/middleware/fileConvert.js
    - public/convert.js

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Used sorting for getting users and filtering for getting a specific user by their id.
- **Video timestamp:**3:14
- **Relevant files:**
    - src/controllers/userController.js
    - public/users.js

### External API(s)

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Additional types of data

- **One line description:** Used JSON storage for jobs, stored jobs in a csv file (jobs.csv), and parsed the csv data to an SQLite database (jobs.db).
- **Video timestamp:**4:15, 4:50
- **Relevant files:**
    - src/middleware/fileConversion.js

### Custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 

### Infrastructure as code

- **One line description:** Used a bash script to deploy the application. Tried AWS Cloudformation but encountered permission issues.
- **Video timestamp:**00:00 - 00:30
- **Relevant files:**
    - docker-compose.yml
    - deploy.sh
    - deploy.yml

### Web client

- **One line description:**Developed a front-end user interface and functionality for the application.
- **Video timestamp:**00:47
- **Relevant files:**
    - public/*

### Upon request

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 