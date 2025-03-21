const { Submission } = require("../models/submission.models"); 
const { User } = require("../models/user.models");
const { getAIReview } = require("./ai.controller");

const submitCode = async (req, res) => {
    try {
        const { title, description, language, code } = req.body;
        
        if (!title || !language || !code) {
            return res.status(400).json({ message: "Title, language, and code are required." });
        }

        const newSubmission = new Submission({
            author: req.user.userId,
            title,
            description,
            language,
            code,
            processingStatus: "in review"
        });

        const savedSubmission = await newSubmission.save();

        await User.findByIdAndUpdate(req.user.userId, { 
            $push: { submissionHistory: savedSubmission._id } 
        });

        try {
            console.log("Automatically starting AI review for submission:", savedSubmission._id);
            
            const aiResponse = await getAIReview(code, language);
            
            savedSubmission.processingStatus = "completed";
            savedSubmission.feedback = {
                aiReview: aiResponse.feedback,
                staticAnalysisResults: aiResponse.staticAnalysis,
                grade: aiResponse.grade,
            };
            savedSubmission.autoFixCode = aiResponse.autoFixCode;
            savedSubmission.complexity = {
                time: aiResponse.timeComplexity,
                space: aiResponse.spaceComplexity
            };
            savedSubmission.securityReview = aiResponse.securityIssues;

            await savedSubmission.save();
            
            console.log("AI review completed automatically");
        } catch (aiError) {
            console.error("Error in automatic AI review:", aiError);
            savedSubmission.processingStatus = "pending";
            await savedSubmission.save();
        }

        res.status(201).json({ message: "Submission created successfully!", submission: savedSubmission });
    } catch (error) {
        res.status(500).json({ message: "Error submitting code", error: error.message });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const { language, status, minGrade, maxGrade } = req.query;
        let filter = {};

        if (language) filter.language = language;
        if (status) filter.processingStatus = status;
        if (minGrade || maxGrade) {
            filter["feedback.grade"] = {};
            if (minGrade) filter["feedback.grade"].$gte = parseInt(minGrade);
            if (maxGrade) filter["feedback.grade"].$lte = parseInt(maxGrade);
        }

        const submissions = await Submission.find(filter).populate("author", "username email");
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching submissions", error: error.message });
    }
};

const getSubmissionById = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate("author", "username email");
        if (!submission) {
            return res.status(404).json({ message: "Submission not found." });
        }
        res.status(200).json(submission);
    } catch (error) {
        res.status(500).json({ message: "Error fetching submission", error: error.message });
    }
};

module.exports = { submitCode, getSubmissions, getSubmissionById };
