const DIV = document.getElementById('game');
function print(text){
    //TODO: add length limits, removing elements by paragraph
    //TODO: add parsing to allow auto-insert of span elements to color text
    DIV.innerHTML += ("<p>" + text + "</p>");
}




//this function is called from the HTML page events. Well, indirectly!
function recieve_command(command){
    console.log("COMMAND: [>>" + command + "]");
    print(">>" + command);
}
