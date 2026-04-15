// Load Header
fetch("https://interview-hub.in/Pages/Assets/header.html")
    .then(response => {
        if (!response.ok) throw new Error("Header not loaded");
        return response.text();
    })
    .then(data => {
        document.getElementById("header").innerHTML = data;
    })
    .catch(error => {
        console.error("Error loading header:", error);
    });

// Load Footer
fetch("https://interview-hub.in/Pages/Assets/footer.html")
    .then(response => {
        if (!response.ok) throw new Error("Footer not loaded");
        return response.text();
    })
    .then(data => {
        document.getElementById("footer").innerHTML = data;
    })
    .catch(error => {
        console.error("Error loading footer:", error);
    });