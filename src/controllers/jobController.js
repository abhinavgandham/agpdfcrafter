const fs = require('fs');
const path = require('path');
const jobs = path.join(__dirname, '../jobs.json');


 // Function that gets all jobs created, admin functionality
const getAllJobs = async (req, res) => {
    try {
        const { role } = req.user;
        if (!fs.existsSync(jobs)) {
            return res.status(404).json({ message: "No jobs found" });
        }
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const allJobs = JSON.parse(fs.readFileSync(jobs, 'utf8'));
        return res.status(200).json(allJobs);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching jobs" });
    }
};

// Function that only gets the jobs createdd by the current logged in user
const getJobs = async (req, res) => {
    try {
        const { username } = req.user;
        if (!fs.existsSync(jobs)) {
            return res.status(404).json({ message: "No jobs found" });
        }
        const allJobs = JSON.parse(fs.readFileSync(jobs, 'utf8'));
        const userJobs = allJobs.jobs.filter(job => job.userName === username);
        return res.status(200).json(userJobs);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching jobs" });
    }
}

module.exports = {
    getJobs,
    getAllJobs
};