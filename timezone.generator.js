const fs = require('fs');
const moment = require('moment-timezone');
const { getAllCountries } = require('countries-and-timezones');

// Load your backend-provided country list
const countriesFromBackend = require('./data/countries.json');
const legacyTimezones = require('./data/legacy.timezone.json');

// Define legacy countries and their corresponding timezones
const legacyCountryTimezones = {
    'CS': {
        zone: 'Europe/Prague',
        name: 'Prague',
    },  // Czechoslovakia (CS) is now split into Czech Republic and Slovakia
    'AN': {
        zone: 'America/Curacao',
        name: 'Curacao',
    }, // Netherlands Antilles (AN) has been dissolved
    'HM': {
        zone: 'Australia/Hobart',
        name: 'Hobart',
    }, // Heard Island and McDonald Islands (HM)
    'BV': {
        zone: 'Europe/Oslo',
        name: 'Oslo',
    }, // Bouvet Island (BV) - technically part of Norway
    // Add more legacy country mappings here as needed
};



async function generateTimezones() {
    try {
        // Get all country data from the countries-and-timezones library
        const timezoneCountries = getAllCountries();
        const data = [];
        console.log("Total raw timezones: " + moment.tz.names().length);
        fs.writeFileSync('./data/raw_timezones.json', JSON.stringify(moment.tz.names(), null, 2))
        console.log("Total legacy timezones: " + legacyTimezones.length);

        countriesFromBackend.forEach((backendCountry) => {
            let timezone = {
                zone: '',
                name: '',
            };

            // First check if the country exists in the countries-and-timezones library
            const countryData = timezoneCountries[backendCountry.iso_code];
            if (countryData) {
                // Retrieve the first timezone for the country
                timezone.zone = countryData.timezones[0];
                timezone.name = moment.tz(timezone.zone).zoneName();
            } else {
                // If the country doesn't exist in the library, check the legacy map
                timezone = legacyCountryTimezones[backendCountry.iso_code];
            }

            if (timezone) {
                // Get the GMT offset in minutes for this timezone
                const gmtOffset = moment.tz(timezone.zone).utcOffset();  // Offset in minutes

                // Convert the offset to the format GMT±HH:mm
                const hours = Math.floor(gmtOffset / 60);
                const minutes = Math.abs(gmtOffset % 60);
                const sign = gmtOffset >= 0 ? '+' : '-';
                const formattedOffset = `GMT${sign}${String(Math.abs(hours)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                // Add the country and timezone data to the array
                data.push({
                    gmt: formattedOffset,
                    zone: timezone.zone,
                    name: timezone.name,
                    country: {
                        name: backendCountry.name,
                        iso_code: backendCountry.iso_code,
                    },
                });
            } else {
                console.warn(`No timezone data found for ISO code: ${backendCountry.iso_code}`);
            }
        });

        // Save the enriched data to a JSON file
        fs.writeFileSync('./data/timezone.json', JSON.stringify(data, null, 2));
        console.log('Timezone data generated successfully!');
        console.log("Total timezones: ", data.length);
    } catch (error) {
        console.error('Error generating timezone data:', error.message);
    }
}

generateTimezones();
