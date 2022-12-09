const mongoose = require('mongoose');

const contirbutionSchema = mongoose.Schema(
    {
        oProjectId: {
            type: mongoose.Schema.ObjectId,
            ref: 'Project',
        },
        name: String,
        email: String,
        commits: Number,
        additions: Number,
        deletions: Number
    },
    { timestamps: { createdAt: 'dCreatedAt', updatedAt: 'dUpdatedAt' } }
);

module.exports = mongoose.model('Contirbution', contirbutionSchema);
