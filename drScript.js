let db; // Declare db in a higher scope

const request = indexedDB.open("patientDB", 4); // Increment version to 4

request.onupgradeneeded = (event) => {
  db = event.target.result;
  // Create patients store if it doesn't exist
  if (!db.objectStoreNames.contains("patients")) {
    db.createObjectStore("patients", { keyPath: "name" });
  }
  // Create medicines store if it doesn't exist
  if (!db.objectStoreNames.contains("medicines")) {
    const medicineStore = db.createObjectStore("medicines", { keyPath: "name" });
    // Add default medicines
    const defaultMedicines = ["Aspirin", "Ibuprofen", "Paracetamol", "Amoxicillin", "Metformin", "Amlodipine"];
    defaultMedicines.forEach(medicine => {
      medicineStore.add({ name: medicine });
    });
  }
};

request.onsuccess = (event) => {
  db = event.target.result; // Assign the opened database to the db variable
  console.log("Database opened successfully.");
  loadPatientsFromDB(); // Call this function when the database is successfully opened
  loadMedicineOptions(); // Add this line
};

request.onerror = (event) => {
  console.error("Error opening database:", event.target.error);
};

const patients = [
  {
    name: "John Doe",
    gender: "Male",
    age: 45,
    nationality: "American",
    checkups: [
      { date: "2022-01-15", notes: "3bass", weight: "70", medicines: [{ name: "Aspirin" }] },
      {
        date: "2022-02-15",
        notes: "Follow-up",
        weight: "72",
        medicines: [{ name: "Ibuprofen" }],
      },
    ],

  },
];
function displayPatients(patientArray) {
  const patientList = document.getElementById("patientList");
  patientList.innerHTML = "";
  patientArray.forEach((patient, index) => {
    const li = document.createElement("li");
    li.textContent = `${patient.name}`;
    li.style.color = patient.gender === "Male" ? "black" : "purple";
    li.addEventListener("click", (e) => {
      if (e.target !== li) return;
      togglePatientDetails(index);
    });
    const details = document.createElement("div");
    details.className = "patient-details";
    details.id = `patient-details-${index}`;

    // Calculate age considering both year and month
    const today = new Date();
    const birthDate = new Date(patient.yearOfBirth, patient.monthOfBirth);
    let years = today.getFullYear() - patient.yearOfBirth;
    let months = today.getMonth() - patient.monthOfBirth;
    
    // Adjust months if negative
    if (months < 0) {
      years--;
      months += 12;
    }

    // Format age string
    let ageString;
    if (years < 3) {
      if (years === 0) {
        ageString = `${months} months`;
      } else {
        ageString = `${years} year${years > 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
      }
    } else {
      ageString = `${years} years`;
    }

    details.innerHTML = `
        <p>Gender: ${patient.gender}</p>
        <p>Nationality: ${patient.nationality}</p>
        <h3>Check-up History:</h3>
        <button onclick="togglePatientDetails(${index})" style="border-radius: 10px;">Close</button>
        <select class="history-entry" onchange="showCheckupNotes(this.value, ${index}); updateMedicines(${index})">
          <option value="">Select a date</option>
          ${patient.checkups
            .map(
              (checkup) => `
          <option value="${checkup.date}">${checkup.date}</option>
          `
            )
            .join("")}
        </select>
        <p>Age: ${ageString}</p>
        <p id="checkupNotes-${index}"></p>
        <p id="checkupWeight-${index}"></p>
        <h3>Medicines:</h3>
        <ul id="medicinesList-${index}"></ul>
        `;

    li.appendChild(details);
    patientList.appendChild(li);
  });
}

function showCheckupNotes(date, index) {
  const checkup = patients[index].checkups.find(
    (checkup) => checkup.date === date
  );
  
  const notesElement = document.getElementById("checkupNotes-" + index);
  if (checkup) {
    notesElement.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>findings:</strong><br>
        ${checkup.notes || 'No medical notes available.'}
      </div>
      <div>
        <strong>Dg:</strong><br>
        ${checkup.notes2 || 'No additional notes available.'}
      </div>
    `;
  } else {
    notesElement.textContent = "No notes available.";
  }
  
  document.getElementById("checkupWeight-" + index).textContent = checkup
    ? `Weight: ${checkup.weight} kg`
    : "No weight recorded.";
}

function togglePatientDetails(index) {
  const details = document.getElementById(`patient-details-${index}`);
  details.style.display = details.style.display === "none" ? "block" : "none";
}

function searchPatients() {
  const searchTerm = document.getElementById("searchBar").value.toLowerCase();
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm)
  );
  displayPatients(filteredPatients);
}

function toggleAddPatientForm() {
  const form = document.getElementById("addPatientForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

function addPatient() {
  const name = document.getElementById("patientName").value.trim();
  const gender = document.getElementById("patientGender").value;
  const birthDate = document.getElementById("patientYearAndMonth").value;
  const nationality = document.getElementById("patientNationality").value;
  const lastCheckup = document.getElementById("patientLastCheckup").value;
  const notes = document.getElementById("patientNotes").value;
  const notes2 = document.getElementById("patientNotes2").value;
  const weight = document.getElementById("patientWeight").value;

  // Get selected medicines from the medicine select element
  const medicineSelect = document.getElementById("medicineSelect");
  const selectedMedicines = Array.from(medicineSelect.selectedOptions).map(option => ({
    name: option.value
  }));

  // Parse birth date
  const [yearOfBirth, monthOfBirth] = birthDate.split('/').map(num => parseInt(num));
  // Adjust month to 0-based index (1-12 -> 0-11)
  const adjustedMonth = monthOfBirth - 1;

  if (name && lastCheckup) {
    const existingPatient = patients.find(
      (patient) => patient.name.toLowerCase() === name.toLowerCase()
    );

    if (existingPatient) {
      existingPatient.checkups.unshift({
        date: lastCheckup,
        notes: notes,
        notes2: notes2,
        weight: weight,
        medicines: selectedMedicines,
      });
      alert("Patient updated with new check-up date, notes, weight, and medicines.");
    } else {
      if (gender && birthDate && nationality) {
        patients.push({
          name,
          gender,
          yearOfBirth,
          monthOfBirth: adjustedMonth,
          nationality,
          checkups: [
            { date: lastCheckup, notes: notes, notes2: notes2, weight: weight, medicines: selectedMedicines },
          ],
        });
        alert("New patient added successfully.");
      } else {
        alert("Please fill in all fields for a new patient.");
        return;
      }
    }

    // Save patients to IndexedDB after adding/updating
    if (db) {
      // Check if db is defined
      savePatientsToDB();
    } else {
      console.error("Database is not initialized. Cannot save patients.");
    }

    // Display updated patient list
    displayPatients(patients);
    toggleAddPatientForm();

    // Reset all input fields after adding or updating a patient
    resetPatientForm();
  } else {
    alert("Please enter at least the patient's name and check-up date.");
  }
}

function resetPatientForm() {
  document.getElementById("patientName").value = "";
  document.getElementById("patientGender").value = "";
  document.getElementById("patientYearAndMonth").value = "";
  document.getElementById("patientNationality").value = "";
  document.getElementById("patientLastCheckup").value = "";
  document.getElementById("patientNotes").value = "";
  document.getElementById("patientNotes2").value = "";
  document.getElementById("patientWeight").value = "";
  document.getElementById("medicineSearch").value = "";
}

function deletePatient(index) {
  if (confirm("Are you sure you want to delete a patient?")) {
    const dialog = document.getElementById("deletePatientDialog");
    const patientList = document.getElementById("patientToDelete");
    patientList.innerHTML = "";
    patients.forEach((patient, index) => {
      const option = new Option(patient.name, index);
      patientList.add(option);
    });
    dialog.showModal();
  }
}

function confirmDelete() {
  const patientList = document.getElementById("patientToDelete");
  const selectedIndex = patientList.value;
  const patientName = patients[selectedIndex].name;

  // Remove the patient from the array
  patients.splice(selectedIndex, 1);

  // Save updated patients to IndexedDB after deletion
  if (db) {
    savePatientsToDB(); // Save changes to the database
  } else {
    console.error("Database is not initialized. Cannot save patients.");
  }

  displayPatients(patients);
  alert(`Patient "${patientName}" has been deleted.`);
  document.getElementById("deletePatientDialog").close();
}

// Initial display of all patients
displayPatients(patients);

function updateMedicines(index) {
  const medicinesList = document.getElementById(`medicinesList-${index}`);

  // Use a more specific selector to get the selected date for the specific patient
  const selectedDate = document.querySelector(
    `#patient-details-${index} .history-entry`
  ).value; // Get selected date
  console.log(`Selected Date for Patient ${index}:`, selectedDate); // Debugging line

  // Find the checkup for the selected date
  const checkup = patients[index].checkups.find(
    (checkup) => checkup.date === selectedDate
  );

  if (checkup) {
    // Display medicines for the selected checkup date
    medicinesList.innerHTML = checkup.medicines.length
      ? checkup.medicines
          .map((medicine) => `<li>${medicine.name}</li>`)
          .join("") // Display medicines
      : "<li>No medicines recorded for this date.</li>"; // Default message if no medicines
  } else {
    medicinesList.innerHTML = "<li>No checkup selected.</li>"; // Default message if no checkup is selected
  }
}

function loadMedicineOptions() {
  if (!db) {
    console.error("Database is not initialized.");
    return;
  }

  const transaction = db.transaction("medicines", "readonly");
  const medicineStore = transaction.objectStore("medicines");
  const request = medicineStore.getAll();

  request.onsuccess = (event) => {
    const medicines = event.target.result;
    const medicineSelect = document.getElementById("medicineSelect");
    medicineSelect.innerHTML = ''; // Clear existing options
    
    medicines.forEach((medicine) => {
      const option = document.createElement("option");
      option.value = medicine.name;
      option.textContent = medicine.name;
      medicineSelect.appendChild(option);
    });
  };

  request.onerror = (event) => {
    console.error("Error loading medicines:", event.target.error);
  };
}

function addMedicine() {
  const medicineSelect = document.getElementById("medicineSelect");
  const newMedicines = document.getElementById("medicineSearch").value.split(",").map(med => med.trim());
  const selectedOptions = Array.from(medicineSelect.selectedOptions).map(option => option.value);

  const transaction = db.transaction("medicines", "readwrite");
  const medicineStore = transaction.objectStore("medicines");

  newMedicines.forEach((newMedicine) => {
    if (newMedicine) {
      const existingOptions = Array.from(medicineSelect.options);
      const exists = existingOptions.some(option => option.value.toLowerCase() === newMedicine.toLowerCase());

      if (!exists) {
        // Add to database
        medicineStore.add({ name: newMedicine });
        
        // Add to select element
        const option = document.createElement("option");
        option.value = newMedicine;
        option.textContent = newMedicine;
        medicineSelect.appendChild(option);
      } else {
        alert(`${newMedicine} already exists in the list.`);
      }
    }
  });

  // Restore selections and clear input
  selectedOptions.forEach(value => {
    const option = Array.from(medicineSelect.options).find(opt => opt.value === value);
    if (option) option.selected = true;
  });
  
  document.getElementById("medicineSearch").value = "";
}

function searchMedicines() {
  const searchTerm = document
    .getElementById("medicineSearch")
    .value.toLowerCase();
  const medicineSelect = document.getElementById("medicineSelect");
  const options = medicineSelect.getElementsByTagName("option");

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const text = option.textContent.toLowerCase();

    // Show all options if the search term is empty, otherwise filter
    option.style.display =
      searchTerm === "" || text.includes(searchTerm) ? "block" : "none";
  }
}

// Save patients to IndexedDB after adding/updating
function savePatientsToDB() {
  const transaction = db.transaction("patients", "readwrite");
  const patientsStore = transaction.objectStore("patients");

  // Clear the existing records before saving the updated list
  const clearRequest = patientsStore.clear();
  clearRequest.onsuccess = () => {
    patients.forEach((patient) => {
      patientsStore.put(patient); // Use put to update or add
    });
  };

  transaction.oncomplete = () => {
    console.log("Patients saved to database successfully.");
  };

  transaction.onerror = (event) => {
    console.error("Error saving patients:", event.target.error);
  };
}

function loadPatientsFromDB() {
  if (!db) {
    console.error("Database is not initialized.");
    return;
  }

  const transaction = db.transaction("patients", "readonly");
  const patientsStore = transaction.objectStore("patients");

  const request = patientsStore.getAll();
  request.onsuccess = (event) => {
    const loadedPatients = event.target.result;
    console.log("Loaded patients from DB:", loadedPatients); // Log loaded patients
    patients.length = 0; // Clear the existing patients array
    patients.push(...loadedPatients); // Update the global patients array
    displayPatients(patients); // Display the loaded patients
  };
  request.onerror = (event) => {
    console.error("Error loading patients:", event.target.error);
  };
}

// Call this function when the page loads
loadPatientsFromDB();

// Optional: Add input validation
document.getElementById("patientYearAndMonth").addEventListener('input', function(e) {
  const input = e.target.value;
  
  // Allow typing numbers and forward slash
  if (!/^\d{0,4}\/?\d{0,2}$/.test(input)) {
    e.target.value = input.slice(0, -1);
    return;
  }
  
  // Automatically add slash after year
  if (input.length === 4 && !input.includes('/')) {
    e.target.value = input + '/';
  }
  
  // Validate complete input
  if (input.length === 7) {
    const [year, month] = input.split('/').map(num => parseInt(num));
    if (year < 1900 || year > new Date().getFullYear() || month < 1 || month > 12) {
      alert('Please enter a valid birth date (YYYY/MM)');
      e.target.value = '';
    }
  }
});
