
function manageHeader(res){

    console.log(res);

    if(res != "Not logged in"){
        var loggedOutButtons = document.getElementsByClassName("loggedOutButtons");
        
        while(loggedOutButtons.length > 0){
            loggedOutButtons[0].parentNode.removeChild(loggedOutButtons[0]);
        }

        var greeting = document.getElementById("greeting");
        greeting.innerText = "Hello, " + res;

        var logoutButton = document.getElementById("logOutButton");

        //logoutLink.appendChild(document.createTextNode("Logout"));

        logoutButton.onclick = function(){
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        //logoutLink.href = "/";
                    
        //document.getElementById("nav-li").appendChild(logoutLink);
    }
    else{
        var loggedInButtons = document.getElementsByClassName("loggedInButtons");

        while(loggedInButtons.length > 0){
            loggedInButtons[0].parentNode.removeChild(loggedInButtons[0]);
        }
    }
}
// module.exports = {
//     manageHeader
// }