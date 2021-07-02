const mongoose = require("mongoose")

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
    }
});

mongoose.set('useFindAndModify', false);
module.exports = mongoose.model("Users", UserSchema);