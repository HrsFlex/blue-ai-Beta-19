import React, { useRef, useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import axios from "axios";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import locationService from "../../services/LocationService";

const API_TOKEN =
  "pk.eyJ1IjoibWFuYW4xNyIsImEiOiJjbGF0N3pkMGgxdnBhM25udmhuZmVwdzRyIn0.roV1T7xiEcFCXMjCkYJxsg";
mapboxgl.accessToken = API_TOKEN;

// Professional doctors data for mental health
const mentalHealthProfessionals = [
  {
    id: 'mh_001',
    name: "Sarah Johnson",
    specialty: "Clinical Psychology",
    degrees: "PhD, PsyD",
    rating: 4.8,
    experience: "15 years",
    availability: "Available today",
    consultationFee: 150,
    telehealth: true,
    phone: "555-0123",
    website: "example.com",
    category: "mental-health"
  },
  {
    id: 'mh_002',
    name: "Michael Chen",
    specialty: "Psychiatry",
    degrees: "MD, Board Certified",
    rating: 4.9,
    experience: "12 years",
    availability: "Tomorrow",
    consultationFee: 200,
    telehealth: true,
    phone: "555-0124",
    website: "example.com",
    category: "mental-health"
  },
  {
    id: 'mh_003',
    name: "Emily Rodriguez",
    specialty: "Counseling & Therapy",
    degrees: "MS, LPC",
    rating: 4.7,
    experience: "8 years",
    availability: "This week",
    consultationFee: 120,
    telehealth: true,
    phone: "555-0125",
    website: "example.com",
    category: "mental-health"
  },
  {
    id: 'mh_004',
    name: "Dr. James Wilson",
    specialty: "Addiction Counseling",
    degrees: "PhD, LPC",
    rating: 4.6,
    experience: "10 years",
    availability: "Next week",
    consultationFee: 130,
    telehealth: true,
    phone: "555-0126",
    website: "example.com",
    category: "mental-health"
  },
  {
    id: 'mh_005',
    name: "Dr. Maria Garcia",
    specialty: "Child & Adolescent Psychology",
    degrees: "PhD, Clinical Psychologist",
    rating: 4.8,
    experience: "14 years",
    availability: "This week",
    consultationFee: 160,
    telehealth: true,
    phone: "555-0127",
    website: "example.com",
    category: "mental-health"
  }
];

const SearchDocs = () => {
  // State for user location and doctors
  const [userLocation, setUserLocation] = useState(null);
  const [lng, setLng] = useState(77.4126); // Bhopal default
  const [lat, setLat] = useState(23.2599); // Bhopal default
  const [zoom, setZoom] = useState(10);
  const [doctors, setDoctors] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  // Mental health professionals state
  const [showMentalHealthModal, setShowMentalHealthModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
const map_id =
  "dXJuOm1ieHJldDowcEJoNE9jeDhTc1A3cktxNVgwWUNfbk1CVGZIbnVBeVY1X09XSzdPN01tMnhXaTZIbXF3a3RTWVlUYnNEcUFFVmNReU91S2VMZFdtSDU1Ty1LalE4MU41RVVMTi1EQ0x4R013UFlveGlQenVnWW5FNHF4TE4tUUxFZGFIckg4UnUyMmxjRXlOcTEwbVd6dmIwMlJCNXR5b2lPMk1xSmI0UHdoX2V1anhnTDNTV1U1U1JpZGFPVkYwTm9VQ3RfUHRYQmkxTFlueXg5djZPV2ktWGphREd2MEsyMEl3WWc5dl9JSmh2WTRfWEd0SVZTSEJua0xEclNnblI4OUJua1VCcV81SFlGVW52RlZQT2hVNktoVlZfVlp5ZTVMVDBRYmkwSWM4dUlkN1VYT0VQY0p3MnJ4UlpoTjZOVnp1MzZvNW1ydHo0eXZTSGdnTVQtNUFqY3BZTDg5dGFHSjltYm5MVVl4T1RaSnJ2QXVXb0FBVTI0R2VyQWp2c2lfXzYyaTNjQlVuN0tQX3hiNVkzZWkxNXZZLXFHZE1YeWp1bmhQcE9Rc3FOQVJLd1VzNWlGelhmeFNSUlNmZ1MyVk52VmFVNFdFUlZJSm00dXM5T0Jody13eURjSDRNVEx3TGNhYTVMSlI0eVV1cXZKUGJod3BXZjdIUFB2VkZnQjQ5UHhIcjVkT0t5STNpVDRER05YODVId20tYU90U08tRDNJODdUZ1VKdUJ5V1p5TThpX3ItRm5VVGNUVXZHemVPQmdrT0ZVNjZCX3lTSWdVT2xUUjMxMG5MdjdCMWxfS1FnSFdST2JzdG05U3J6UVZma3plMVFUa1dmWFJzZTVfSmE2R0lIQ3hncFlEdDdieTVDZnhYRl9pMTN4RTJqXzdOV1hlc0tRSGg5WWtSRVhDR1lDLUZMbHpvRExFaG5qRjgtelpoOWdfMVdidWNjY3dMZmdNZHlPZlFHRmZwVXctUWdfN0RPY1lDLWF6M2NodXRiSTdJX1R2MU10cTM3dUNvQ3pjc0d6RFBQZm9kT1hveF9VYzVIUkxEXzM0dVphblZMMzZWZ2FhOWpDa2NyVlJOcHptV0xFa1RCNkZnT3o2bDRaTDZiclpsQUZna0RxSDNyQWlqUnhOTm5vOUQ1SjZmTk9rd0NHUmdxdFluOFliNVpvdHl6QUtYX01pT2hoNk0zckVkbU5aMDVIMmhIN010QUc3c0R0TEtKTGxLODF4Z1loc3lMWWdnZFVfdDIzeWZVMmlFejRXVEMxcDE2dnZONktDUlZaU1NzYlJKMHFlVmQ2Z2hVckNSV2s3eVcyS3Bob3pXZVpOYS1DUVVrd2ppQnJwcVgyc1ZTX3MtNnhISW9yMVlTTHpDM3RJRkN5b0ZIMzRyWHltZWk5Mi1vZkVrcDU1cFJXTDhJcUxfczRGWnh6aUk2RUpiemxFWGRaM3p1OFFCQUhmT2EweWRfRkx4Mmt5eHdnMlB5X2M2MDBkV05BeXBpQVdWTFZia2FsNFBqRGd3Y2Rvb3dHWEQzU21ncV9WZzNjUDNLal85Q0dYQnVvWjVIWW56U0h5Qm53Mm9sWkFzdHJNV3c0T2FMWURfNU1CQVo0Y1BLN0JseDZLWTBYOEt2amRfV0FJSENxQ0tRcnd0a0U1RThmOTFqYXp2U1p3U1gyNFhYczZjQzcwTUhxX3RVaWZ2OUJCVlpqSkZIWnpFMnltak1DRXBlb0QzNE05dzljM1AzenZPMnZGYnUyYllrNkJsX3NFazNqLUlVTE1jVXExTXNPSGZoNkZVWUtVVDlFUXhxbVNJNGdKYVJiTXBTQWFuLXpFQlBpRm9EUlFEdGdqZDYtbWtsSmhZQ3JFNndQRzhxR2N5Yk1TWk9tWGh5V0U2UHdJLVZTQ01HN0xyVXZmLTNRVC1uWlp0Q0k2UTRnbThoTmtLTU1JMnJhVnVjVlN2ZWdmWnl0VEoxS3JMS1VYRXFORTE5TDVHLU0zaGIzRGdjMEFTOFFSdllDZTFFU0pDcWE3ODBRUThyLVg5Z1o5Mk9tYzJtbW1nY01TRkZUMFlKQW8yT1Nac3VlbGswajJhTWxxdG95UGdqckNISm43T2lVX0JEcmpwcXkzX2tVNjAtVlZETmFycnNkb0VuME54b1AzTWtnSHd4elFrYVlDXzZtTmJUNUpGa0NJZUhXaV8zVlJSUS1BdkpoMXJ5N0FYMi1hbnpoV21lTmkxSVl0ZmNXWGhmTHZZVHMzeTVxN2FwZ3czeXE2STRSVjRCMmt3NnB2TFA4UENVQ1lfaUlHOHktVFczMG10eUpsNDhhYlNJNzB1S1h3blJwRjFmMWdnRkxSbnB3ZEJqSkROU0h6aWpSellMQnNjMkZpbDVNelVCX2lURVk0b2NrOURvUWJ5MEl6cVFWcTVSNlh5U1QzcWlfZHotZDM2R3B6Y3AzRWdfVzdpNjlEUUgySDZ1eEJjMU1zQ3NidW9EOTRodmJjcXdrc2xkM3JyWXUtTTVWTmRIQUIxdWRHWVpiMjRYTnoyMkZ0TkkteFFjSkdUWTJ5SGdpemhpdVdiWWhpcU5nZzJlbkZPVXlJV3kyOHJkaXBFSWtjeV9CQm1UUVZSU09UVlRWbHphNHRhYzQyYUYwTjVUOUt2MjVHaG1RdFRoYzhIbXFTY1h6bzQwUVZsRHMxMDRFR0tkTkRkdXJuR2d0RjB2NVR5RldGT1NOTGhEcGZyOVAyTT0";

const SearchDocs = () => {
  // State for user location and doctors
  const [userLocation, setUserLocation] = useState(null);
  const [lng, setLng] = useState(77.4126); // Bhopal default
  const [lat, setLat] = useState(23.2599); // Bhopal default
  const [zoom, setZoom] = useState(10);
  const [doctors, setDoctors] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  useEffect(() => {
    // Initialize location and fetch doctors
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await locationService.getUserLocation();
      setUserLocation(location);

      // Update map coordinates based on user location
      setLng(location.lng);
      setLat(location.lat);

      // Adjust zoom based on location type
      if (location.source === 'browser') {
        setZoom(12); // More zoom for precise location
      } else {
        setZoom(10); // Standard zoom for city-level
      }

      // Fetch doctors for user's location
      await getDoctors(location);
    } catch (error) {
      console.error('Error initializing location:', error);
      // Fallback to default Bhopal location
      await getDoctors(locationService.defaultLocation);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocationSelect = async (city, state, country) => {
    try {
      setLoadingLocation(true);
      const manualLocation = locationService.setManualLocation(city, state, country);
      setUserLocation(manualLocation);
      setLng(manualLocation.lng);
      setLat(manualLocation.lat);
      setZoom(12);
      await getDoctors(manualLocation);
      setShowLocationOptions(false);
    } catch (error) {
      console.error('Error setting manual location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const getDoctors = async (location) => {
    try {
      const searchQuery = locationService.getDoctorSearchQuery(location);
      const country = location.country === 'India' ? 'in' : 'us';
      const sessionToken = generateSessionToken();

      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchQuery)}&language=en&proximity=${location.lng},${location.lat}&country=${country}&session_token=${sessionToken}&access_token=${API_TOKEN}`;
      const result = await axios.get(url);
      console.log('Doctors found:', result.data);
      setDoctors(result.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  // Generate a simple session token
  const generateSessionToken = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const map = useRef(null);
  const mapContainer = useRef(null);

  const fetchLocation = async (map_id) => {
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${map_id}?session_token=0dca88fe-dac2-4f31-88ae-83ccd8a0b719&access_token=${API_TOKEN}`;
    const result = await axios.get(url);
    console.log(result.data.features[0].geometry.coordinates);
    new mapboxgl.Marker()
      .setLngLat(result.data.features[0].geometry.coordinates)
      .addTo(map.current);

    mapContainer.current.scrollIntoView({ behavior: "smooth" });
  };

  // Mental Health Professionals Functions
  const createAppointmentWithProfessional = async (professional, date, time) => {
    try {
      const response = await fetch('http://127.0.0.1:8001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Appointment with ${professional.name} - ${professional.specialty}`,
          type: 'appointment',
          priority: 'high',
          due_date: `${date}T${time}`
        })
      });

      if (!response.ok) throw new Error('Failed to create appointment');

      alert(`Appointment booked successfully with ${professional.name}! Check your health dashboard for details.`);
      setShowMentalHealthModal(false);
      setSelectedProfessional(null);
      setShowAppointmentForm(false);
      setAppointmentDate('');
      setAppointmentTime('');
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const handleProfessionalSelect = (professional) => {
    setSelectedProfessional(professional);
    setShowAppointmentForm(true);
  };

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat]);

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="w-full">
        <div className="flex flex-row items-center justify-between p-6 bg-teal-100 h-fit shadow-lg">
          <div>
            <h1 className="ml-4 text-3xl font-semibold text-teal-800">
              Recommended Doctors
            </h1>
            {userLocation && (
              <p className="ml-4 text-sm text-teal-600 mt-1">
                Location: {locationService.formatLocation(userLocation)}
                {userLocation.source === 'browser' && ' (Precise Location)'}
                {userLocation.source === 'ip' && ' (Based on IP)'}
              </p>
            )}
          </div>
          {loadingLocation ? (
            <div className="flex items-center mr-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <span className="ml-2 text-teal-600 text-sm">Detecting location...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={initializeLocation}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                Refresh Location
              </button>
              <button
                onClick={() => setShowLocationOptions(!showLocationOptions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Change City
              </button>
              <button
                onClick={() => setShowMentalHealthModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                🧠 Mental Health Pros
              </button>
            </div>
          )}
        </div>

        {/* Location Options Dropdown */}
        {showLocationOptions && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mx-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Your City</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => handleManualLocationSelect('Bhopal', 'Madhya Pradesh', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Bhopal
              </button>
              <button
                onClick={() => handleManualLocationSelect('Mumbai', 'Maharashtra', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Mumbai
              </button>
              <button
                onClick={() => handleManualLocationSelect('Delhi', 'Delhi', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Delhi
              </button>
              <button
                onClick={() => handleManualLocationSelect('Bangalore', 'Karnataka', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Bangalore
              </button>
              <button
                onClick={() => handleManualLocationSelect('Chennai', 'Tamil Nadu', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Chennai
              </button>
              <button
                onClick={() => handleManualLocationSelect('Kolkata', 'West Bengal', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Kolkata
              </button>
              <button
                onClick={() => handleManualLocationSelect('Pune', 'Maharashtra', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Pune
              </button>
              <button
                onClick={() => handleManualLocationSelect('Hyderabad', 'Telangana', 'India')}
                className="px-3 py-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 transition-colors text-sm"
              >
                Hyderabad
              </button>
            </div>
            <button
              onClick={() => setShowLocationOptions(false)}
              className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="p-6">
          {loadingLocation ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
              <span className="text-teal-600">Loading doctors in your area...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No doctors found in your area
              </h2>
              <p className="text-gray-600 mb-4">
                Try refreshing your location or search in a different area
              </p>
              <button
                onClick={initializeLocation}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Refresh Location
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {doctors.length} doctors in {userLocation ? locationService.formatLocation(userLocation) : 'your area'}
              </div>
              <table className="table-auto w-full">
                <thead className="bg-neutral-100 h-[50px] shadow">
                  <tr>
                    <th>
                      <h1 className="text-lg font-bold text-teal-800">Name</h1>
                    </th>
                    <th>
                      <h1 className="text-lg font-bold text-blue-800">Address</h1>
                    </th>
                    <th>
                      <h1 className="text-lg font-bold text-sky-900">Area</h1>
                    </th>
                    <th>
                      <h1 className="text-lg font-bold text-green-800">Type</h1>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doctors?.map((doc) => (
                    <tr
                      key={doc.mapbox_id}
                      onClick={() => fetchLocation(doc.mapbox_id)}
                      className="bg-white h-[50px] shadow cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td>
                        <h1 className="text-lg font-semibold text-teal-800 px-2">
                          {doc?.name}
                        </h1>
                      </td>
                      <td>
                        <h1 className="text-lg font-semibold text-blue-800">
                          {doc?.full_address || "No address available"}
                        </h1>
                      </td>
                      <td>
                        <h1 className="text-lg font-semibold text-sky-900">
                          {doc?.context?.locality?.name || doc?.place_name || "Unknown"}
                        </h1>
                      </td>
                      <td>
                        <h1 className="text-lg font-semibold text-green-800">
                          {doc?.poi_category && doc.poi_category.length > 0
                            ? doc.poi_category[0]
                            : "General Practice"}
                        </h1>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div ref={mapContainer} className="h-[400px]" />

        {/* Mental Health Professionals Modal */}
        {showMentalHealthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">🧠 Connect with Mental Health Professionals</h2>
                  <button
                    onClick={() => {
                      setShowMentalHealthModal(false);
                      setSelectedProfessional(null);
                      setShowAppointmentForm(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mt-2">Find compassionate mental health professionals who can support your wellness journey</p>
              </div>

              <div className="p-6">
                {!showAppointmentForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentalHealthProfessionals.map(professional => (
                      <div key={professional.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-gray-800">Dr. {professional.name}</h3>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-sm font-medium">{professional.rating}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="font-medium text-purple-600">{professional.specialty}</div>
                          <div>{professional.degrees}</div>
                          <div>Experience: {professional.experience}</div>
                          <div>Availability: <span className="text-green-600">{professional.availability}</span></div>
                          <div>Consultation: ${professional.consultationFee}</div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          {professional.telehealth && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">📱 Telehealth</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleProfessionalSelect(professional)}
                          className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Book Appointment
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                      <h3 className="font-bold text-xl text-purple-800 mb-2">
                        Dr. {selectedProfessional.name}
                      </h3>
                      <div className="text-purple-700 space-y-1">
                        <div>{selectedProfessional.specialty}</div>
                        <div>{selectedProfessional.degrees}</div>
                        <div>Consultation Fee: ${selectedProfessional.consultationFee}</div>
                      </div>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      createAppointmentWithProfessional(selectedProfessional, appointmentDate, appointmentTime);
                    }}>
                      <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Select Date</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">Select Time</label>
                        <input
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          Confirm Appointment
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAppointmentForm(false);
                            setSelectedProfessional(null);
                            setAppointmentDate('');
                            setAppointmentTime('');
                          }}
                          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Back
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDocs;
