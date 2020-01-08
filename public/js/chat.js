// external libraries like jquery and moment are added to the front end by copying and pasting them in the js folder from internet

var socket = io();  // integrating socket io to the front end of the application with the help of methods provided by socket.io.js file

// utility method to enable autoscrolling
function scrollToBottom () {
    var messages = jQuery("#messages");
    var newMsg = messages.children("li:last-child");

    var clientHeight = messages.prop("clientHeight");
    var scrollHeight = messages.prop("scrollHeight");
    var scrollTop = messages.prop("scrollTop");
    var newMsgHeight = newMsg.innerHeight();
    var lastMsgHeight = newMsg.prev().innerHeight();

    // check if the last message is visible or not
    // if it is visible then scroll to the bottom to view the new message else don't scroll
    if (clientHeight + scrollTop + newMsgHeight + lastMsgHeight >= scrollHeight) {
        messages.scrollTop(scrollHeight); // scrolling back to the bottom
    }
}

socket.on("connect", function () {  // event listeners
    console.log("Connected to the server!");

    var params = jQuery.deparam(window.location.search);
    socket.emit('join', params, function (err) {
        if (err) {
            alert(err);
            window.location.href = "/";
        }
        else {
            console.log("No error!");
        }
    })
});

socket.on("disconnect", function () {
    console.log("Disconnected from the server!");
});

socket.on('updateUsersList', function (users) {
    console.log(users);

    var ol = jQuery("<ol></ol>");
    users.forEach(user => {
        ol.append(jQuery("<li></li>").text(user));
    });
    jQuery("#users").html(ol);

});

socket.on("newMessage", function (message) {
    console.log("newMsg", message);
    var formattedTime = moment(message.at).format("h:mm a");    // using moment library to format the timestamp returned by the server
    
    var template = jQuery("#message-template").html();
    var html = Mustache.render(template, {
        text: message.text,
        from: message.from,
        at: formattedTime
    });
    jQuery("#messages").append(html);

    scrollToBottom();
    
    // var li = jQuery("<li></li>");   // creating a new li element
    // li.text(`${message.from} ${formattedTime}: ${message.text}`);
    // jQuery("#messages").append(li); // appending the list item to the ordered list
});

socket.on("newLocationMessage", function (message) {
    var formattedTime = moment(message.at).format("h:mm a");
    
    var template = jQuery("#location-message-template").html();
    var html = Mustache.render(template, {
        from: message.from,
        url: message.url,
        at: formattedTime
    });
    jQuery("#messages").append(html);

    scrollToBottom();
    
    // var li = jQuery("<li></li>");
    // var a = jQuery("<a target='_blank'>My Current Location</a>"); // target=_blank opens up the link in a new tab of the browser
    // li.text(`${message.from} ${formattedTime}: `);
    // a.attr("href", message.url);
    // li.append(a);
    // jQuery("#messages").append(li);
});

// submit event listener on the form
jQuery("#message-form").on('submit', function (e) {
    e.preventDefault(); // preventing the default action of reloading the page

    var msgBox = jQuery("[name=message]");  // selecting the input element by its attribute
    
    socket.emit('createMessage', {  // emitting a createMsg event when the form is submitted
        text: msgBox.val()  // data of the form is sent to the server where the event is listened and a newMsg event is fired for all users
    }, function() { // 3rd argument is for event acknowledgement from the server
        msgBox.val('');
    });
});

var locationBtn = jQuery("#send-location");
locationBtn.on('click', function() {    // event fired on clicking the send Location btn
    if (!navigator.geolocation) {   // checking if the browser supports geolocation api
        return alert("Geolocation not supported by your browser");
    }

    locationBtn.attr('disabled','disabled').text("Sending location...");    // disabling the send loc btn until the action is completed

    navigator.geolocation.getCurrentPosition(function (pos) {   // success function
        locationBtn.removeAttr('disabled').text("Send location");   // re-enabling the btn and changing back its text
        
        socket.emit("createLocationMessage", {  // emitting a create location msg event
            lat: pos.coords.latitude,
            long: pos.coords.longitude
        });

    }, function () {    // error func executed if some error occurs while fetching the coordinates
        locationBtn.removeAttr('disabled').text("Send location");
        alert("Unable to fetch the location");
    });
});