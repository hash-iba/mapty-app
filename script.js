"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.duration = duration; // in min
    this.distance = distance; // in km
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.desciprion = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    return (this.pace = this.duration / this.distance); // min/km
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    return (this.speed = this.distance / (this.duration / 60)); // km/hr
  }
}

// const run1 = new Running([39, -12], 24, 5.2, 178);
// const cycle1 = new Running([39, -12], 95, 27, 523);

class App {
  #map;
  #mapEvent;
  #workoutArr = [];

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not find location");
        }
      );
  }

  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on Map
    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    // prettier-ignore
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    // Validation functions
    const areNumbers = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const arePositive = (...inputs) => inputs.every((inp) => inp > 0);

    // Get data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Validate input data
      if (
        !areNumbers(distance, duration, cadence) ||
        !arePositive(distance, duration, cadence)
      )
        return alert("Invalid entry. The numbers must be positive!");

      // Create new Workout Running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling
    if (type === "cycling") {
      const elevationGain = +inputElevation.value;
      // Validate input data
      if (
        !areNumbers(distance, duration, elevationGain) ||
        !arePositive(distance, duration)
      )
        return alert("Invalid entry. The numbers must be positive!");

      // Create new Workout Cycling object
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Push workout to workoutArr
    this.#workoutArr.push(workout);

    // Render workoutArr on Map
    console.log(workout);

    // Render marker
    this._renderWorkoutMarker(workout);

    // Render workoutArr list
    this._renderWorkoutList(workout);

    // Hide Form +Clear input fields
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.desciprion}`
      )
      .openPopup();
  }

  _renderWorkoutList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.desciprion}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `;

    if (workout.type === "cycling")
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
    `;

    // Insert html after the form element
    form.insertAdjacentHTML("afterend", html);
  }
}

const app = new App();
