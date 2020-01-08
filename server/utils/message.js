const moment = require("moment");   // library to handle timestamps effectively

var getMsg = (from, text) => {
    return {
        from,
        text,
        at: moment().valueOf()  // getting the current timestamp
    };
}

var getLocMsg = (from, lat, long) => {
    return {
        from,
        url: `https://www.google.com/maps?q=${lat},${long}`,    // creating the google maps url for the user's current position
        at: moment().valueOf()
    };
}

module.exports = {getMsg, getLocMsg};