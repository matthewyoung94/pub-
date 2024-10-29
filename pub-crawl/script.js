import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const pubList = document.getElementById("pub-list");
const loadingSpinner = document.getElementById("loading-spinner");
const auth = getAuth();

let map;
let pubs = [];
let markers = [];

function showLoadingSpinner() {
  loadingSpinner.style.display = "flex";
}

function hideLoadingSpinner() {
  loadingSpinner.style.display = "none";
}

window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 50.8172, lng: -0.3725 },
    zoom: 13,
  });

  pubs.forEach((pub) => {
    if (pub.lat && pub.lng) {
      const marker = new google.maps.Marker({
        position: { lat: pub.lat, lng: pub.lng },
        map: map,
        title: pub.name,
      });

      const infoWindowContent = `
                <div style="max-width: 200px;">
                    <h3>${pub.name}</h3>
                    <p><strong>Address:</strong> ${pub.address}</p>
                    <img src="${pub.imageUrl}" alt="${pub.name}" style="width: 100%;">
                </div>
            `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    }
  });
};

function renderPub(pub) {
  const pubCard = `
         <div class="pub-card">
            <h3>${pub.name}</h3>
            <p>Average Pint Price: £${pub.averagePint}</p>
            <p>Food: ${pub.hasFood ? "Yes" : "No"}</p>
            <p>Games: ${pub.games ? "Yes" : "No"}</p>
            <p>Shows Sports: ${pub.showsSports ? "Yes" : "No"}</p>
            <button class="details-button">View Details</button>
        </div>
    `;
  pubList.innerHTML += pubCard;
}

async function fetchPubDetails(pubName) {
  const service = new google.maps.places.PlacesService(
    document.createElement("div")
  );

  return new Promise((resolve, reject) => {
    const request = {
      query: pubName + ", Worthing",
      fields: ["name", "geometry", "photos", "formatted_address"],
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results.length
      ) {
        const pub = results[0];

        const pubData = {
          name: pub.name,
          address: pub.formatted_address,
          lat: pub.geometry.location.lat(),
          lng: pub.geometry.location.lng(),
          imageUrl:
            pub.photos && pub.photos.length > 0
              ? pub.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
              : "default_image_url_here",
        };

        resolve(pubData);
      } else {
        reject("Place not found");
      }
    });
  });
}

async function updatePubInFirestore(pub, pubDetails) {
  const pubDocRef = doc(db, "pubs", pub.name);

  try {
    await updateDoc(pubDocRef, {
      address: pubDetails.address,
      lat: pubDetails.lat,
      lng: pubDetails.lng,
      imageUrl: pubDetails.imageUrl,
    });
    console.log(`Pub ${pub.name} updated in Firestore`);
  } catch (error) {
    console.error("Error updating pub: ", error);
  }
}

async function fetchAndUpdateAllPubs() {
  for (const pub of pubs) {
    try {
      const pubDetails = await fetchPubDetails(pub.name);
      console.log(`Fetched details for ${pub.name}:`, pubDetails);
      await updatePubInFirestore(pub, pubDetails);
    } catch (error) {
      console.error(
        `Error fetching or updating details for ${pub.name}:`,
        error
      );
    }
  }
  initMap();
}

async function fetchPubs() {
  showLoadingSpinner();
  const pubsCollection = collection(db, "pubs");
  try {
    const snapshot = await getDocs(pubsCollection);
    pubs = snapshot.docs.map((doc) => {
      const pubData = doc.data();
      pubData.name = doc.id;
      renderPub(pubData);
      return pubData;
    });
    initMap();
  } catch (err) {
    console.error("Error fetching pubs: ", err);
  } finally {
    hideLoadingSpinner();
  }
}

fetchAndUpdateAllPubs();
fetchPubs();

async function loadPubs() {
  const pubOptionsSelect = document.getElementById("pub-options");
  console.log(pubOptionsSelect);
  const pubsCollection = collection(db, "pubs");

  try {
    const snapshot = await getDocs(pubsCollection);

    snapshot.forEach((doc) => {
      const pub = doc.data();

      const option = document.createElement("option");
      option.value = pub.name;
      option.textContent = pub.name;

      pubOptionsSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading pubs:", error);
    alert("Error loading pub options. Please try again later.");
  }
}

document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const crawlName = document.getElementById("crawl-name").value.trim();
  const notes = document.getElementById("notes").value.trim();

  const selectedPubs = Array.from(
    document.getElementById("pub-options").selectedOptions
  ).map((option) => option.value);

  if (!crawlName) {
    alert("Crawl name is required.");
    return;
  }

  if (selectedPubs.length === 0) {
    alert("Please select at least one pub.");
    return;
  }

  try {
    await addDoc(collection(db, "pubCrawls"), {
      name: crawlName,
      pubs: selectedPubs,
      notes: notes,
      createdAt: new Date(),
    });

    alert("Pub Crawl Created Successfully!");
    document.getElementById("create-form").reset();
  } catch (error) {
    console.error("Error creating pub crawl:", error);
    alert("There was an error creating your pub crawl. Please try again.");
  }
});

loadPubs();

const signupBtn = document.getElementById("signup-btn");
signupBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Sign up successful! You are now logged in.");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Signup error:", error);
    alert(`Error: ${error.message}`);
  }
});

const loginBtn = document.getElementById("login-btn");
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    alert(`Error: ${error.message}`);
  }
});

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Logged out successfully.");
  } catch (error) {
    console.error("Logout error:", error);
    alert(`Error: ${error.message}`);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`User logged in: ${user.email}`);
    document.getElementById("auth-form").style.display = "none";
    document.getElementById("logout-btn").style.display = "block";
  } else {
    console.log("User logged out");
    document.getElementById("auth-form").style.display = "block";
    document.getElementById("logout-btn").style.display = "none";
  }
});
