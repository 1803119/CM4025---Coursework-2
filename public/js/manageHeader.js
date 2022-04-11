
function manageHeader(){
    var res = "<%- firstName %>";
    console.log(res);

    if(res != "Not logged in"){
        var initialButtons = document.getElementsByClassName("initialButtons");
        
        while(initialButtons.length > 0){
            initialButtons[0].parentNode.removeChild(initialButtons[0]);
        }

        var greeting = document.getElementById("greeting");
        greeting.innerText = "Hello, " + res;

        var logoutLink = document.createElement("a");
        logoutLink.appendChild(document.createTextNode("Logout"));

        logoutLink.onclick = function(){
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        logoutLink.href = "/";
                    
        document.getElementById("nav-li").appendChild(logoutLink);
    }
}
module.exports = {
    manageHeader
}