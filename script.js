'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords; // [lat,lng]
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // console.log(this);
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycyling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration * 60);
        return this.speed;
    }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new Cycyling([39, -12], 27, 95, 523);
// console.log(run1, cycle1);

// APPLICATION ARCHITECHTURE
class App {
    #map;
    #mapEvent;
    #workouts = [];

    constructor() {
        // this.workouts = [];
        this._getPosition();

        form.addEventListener('submit', this._netWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
    }

    _getPosition() {
        if (!navigator.geolocation) {
            log.error('Geolocation not supported by your browser');
        } else {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    console.log('error');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;

        //  L.map(//id of an element target)
        this.#map = L.map('map').setView([latitude, longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField(event) {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _netWorkout(event) {
        event.preventDefault();

        const validInputs = (...inputs) =>
            inputs.every(input => Number.isFinite(input));

        const allPositive = (...inputs) => inputs.every(input => input > 0);

        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value; // convert to number using '+' infront
        const duration = +inputDuration.value; // convert to number using '+' infront
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // if activity running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Check if data is valid
            if (
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration)
            ) {
                return alert('Inputs have to be number');
            }

            workout = new Running([lat, lng], distance, duration, cadence);
            this.#workouts.push(workout);
        }

        // if activity cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            // Check if data is valid
            // if (
            //     !Number.isFinite(distance) ||
            //     !Number.isFinite(duration) ||
            //     !Number.isFinite(elevation)
            // ) {return alert('Inputs have to be number'); }
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            ) {
                return alert('Inputs have to be number');
            }
            workout = new Cycyling([lat, lng], distance, duration, elevation);
        }

        // add new object to workout array
        this.#workouts.push(workout);
        console.log(workout);

        // render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // clear input fields
        inputDistance.value = '';
        inputDuration.value = '';
        inputCadence.value = '';
        inputElevation.value = '';
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords, {
            riseOnHover: true,
        })
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent('workout')
            .openPopup();
    }

    _renderWorkout(workout) {
        console.log(workout);
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">Running on${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
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

        if (workout.type === 'running') {
            console.log('ss');
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
            form.insertAdjacentHTML('afterend', html);
        }

        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;

            form.insertAdjacentHTML('afterend', html);
        }
    }
}

const app = new App();
