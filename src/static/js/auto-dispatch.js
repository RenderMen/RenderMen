$(document).ready(function() {
    var socket = io.connect('/rendering');

    socket.emit('get rendering', '/rendering');

    socket.on('new rendering', function(data) {
        if(!data.ok) {
            console.log("Couldn't retrieve a rendering (all done ?)");
            return;
        }

        var rendering = data.result;

        window.location.replace('/rendering/' + rendering._id.$oid);
    });

});
