const DynamoDB = require("@aws-sdk/client-dynamodb");
const DynamoDBLib = require("@aws-sdk/lib-dynamodb");
const { getDynamoDBSecret } = require("./secretsManager");

/**
 * Function that inserts a job into the DynamoDB table
 * @param {string} username - The QUT username
 * @param {string} jobId - The job ID
 * @param {string} originalFileName - The original file name
 * @param {string} convertedFileName - The converted file name
 * @param {string} fileType - The file type
 * @param {string} userName - The user name
 * @param {string} jobResult - The job result
 * @param {string} timeStamp - The time stamp
 * @param {string} fileSize - The file size
 * @param {string} pdfSize - The PDF size
 * @param {string} downloadUrl - The download URL
 */
  const insertJob = async (username, jobId, 
    originalFileName, convertedFileName,
     fileType, userName, 
     jobResult, timeStamp, 
     fileSize, pdfSize, downloadUrl) => {
    const client = new DynamoDB.DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });
    const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);
    const tableName = await getDynamoDBSecret();
    const command = new DynamoDBLib.PutCommand({
        TableName: tableName,
        Item: {
            "qut-username": username,
            "jobId": jobId,
            "originalFileName": originalFileName,
            "convertedFileName": convertedFileName,
            "fileType": fileType,
            "userName": userName,
            "jobResult": jobResult,
            "timeStamp": timeStamp,
            "fileSize": fileSize,
            "pdfSize": pdfSize,
            "downloadUrl": downloadUrl
        }
    })
    await docClient.send(command);
    console.log(`✅ Job ${jobId} inserted into ${tableName}`);
  }

  /**
   * Function that gets the jobs for a user from the DynamoDB table
   * @param {string} qutUsername - The QUT username
   * @param {string} actualUsername - The actual username
   * @returns {Array} - The jobs for the user
   */
  const getUserJobs = async (qutUsername, actualUsername) => {
    const client = new DynamoDB.DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });
    const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);
    const tableName = await getDynamoDBSecret();
    const command = new DynamoDBLib.QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "#username = :username",
      FilterExpression: "#userName = :actualUsername",
      ExpressionAttributeNames: {
        "#username": "qut-username",
        "#userName": "userName"
      },
      ExpressionAttributeValues: {
        ":username": qutUsername,
        ":actualUsername": actualUsername
      }
    });
    
    const result = await docClient.send(command);
    return result.Items || [];
  };

  /**
   * Function that gets all jobs from the DynamoDB table
   * @returns {Array} - All jobs in the DynamoDB table
   */
  const getAllJobsFromDB = async () => {
    const client = new DynamoDB.DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" });
    const docClient = DynamoDBLib.DynamoDBDocumentClient.from(client);
    const tableName = await getDynamoDBSecret();
    const command = new DynamoDBLib.ScanCommand({
      TableName: tableName
    });
    
    const result = await docClient.send(command);
    return result.Items || [];
  };


  module.exports = {insertJob, getUserJobs, getAllConversionJobs: getAllJobsFromDB}