const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");


const ssmClient = new SSMClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
});

const getParameterValue = async (paramName) => {
    console.log(`🔍 Attempting to get parameter: ${paramName}`);
    console.log(`🔍 Using region: ${process.env.AWS_REGION || "ap-southeast-2"}`);
    
    try {
        const command = new GetParameterCommand({ Name: paramName });
        const response = await ssmClient.send(command);
        console.log(`✅ Successfully retrieved parameter: ${paramName} = ${response.Parameter.Value}`);
        return response.Parameter.Value;
    } catch (error) {
        console.error(`❌ Error getting parameter ${paramName}:`, error.message);
        console.error(`❌ Error type:`, error.__type);
        throw error;
    }
}

module.exports = { getParameterValue };