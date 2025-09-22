const { getUserJobs, getAllConversionJobs  } = require('../cloudservices/dynamodb');


/**
 * Function that gets all jobs created, admin functionality
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const getAllJobs = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const allJobs = await getAllConversionJobs();
        return res.status(200).json({ jobs: allJobs || [] });
    } catch (error) {
        console.error("Error fetching all jobs:", error);
        return res.status(500).json({ message: "Error fetching jobs" });
    }
};

/**
 * Function that only gets the jobs created by the current logged in user
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const getJobs = async (req, res) => {
    try {
        const { username } = req.user;
        // Use your QUT email as the partition key for DynamoDB
        const qutUsername = 'n11795611@qut.edu.au';
        const userJobs = await getUserJobs(qutUsername, username);
        return res.status(200).json(userJobs);
    } catch (error) {
        console.error("Error fetching user jobs:", error);
        return res.status(500).json({ message: "Error fetching jobs" });
    }
}

module.exports = {
    getJobs,
    getAllJobs
};