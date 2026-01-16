// ===================================
// Global State
// ===================================
let currentDate = new Date().toISOString().split('T')[0];
let selectedTimeSlot = null;
let selectedSeat = null;
let reservations = [];
let realtimeChannel = null;

// ===================================
// Initialize App
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    initializeDateTimeDisplay();
    generateSeatGrid();
    setupEventListeners();

    // Initialize Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
        await loadReservations();
        setupRealtimeSubscription();
    } else {
        showError('Supabase no está configurado. Por favor actualiza supabase-config.js con tus credenciales.');
    }
});

// ===================================
// Date & Time Display
// ===================================
function initializeDateTimeDisplay() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = new Date();

    // Format date
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateStr = now.toLocaleDateString('es-ES', dateOptions);
    document.getElementById('currentDate').textContent = dateStr;

    // Format time
    const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeStr;
}

// ===================================
// Seat Grid Generation
// ===================================
function generateSeatGrid() {
    const seatGrid = document.getElementById('seatGrid');
    seatGrid.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat disabled';
        seat.dataset.seatNumber = i;
        seat.innerHTML = `
      <div class="seat-icon">🚌</div>
      <div class="seat-number">${i}</div>
    `;

        seat.addEventListener('click', () => handleSeatClick(i));
        seatGrid.appendChild(seat);
    }
}

// ===================================
// Event Listeners
// ===================================
function setupEventListeners() {
    // Time slot selection
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => handleTimeSlotClick(btn.dataset.time));
    });

    // Form submission
    document.getElementById('reservationForm').addEventListener('submit', handleFormSubmit);
}

// ===================================
// Time Slot Selection
// ===================================
function handleTimeSlotClick(timeSlot) {
    selectedTimeSlot = timeSlot;

    // Update UI
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.time-slot-btn').classList.add('active');

    // Reset seat selection
    selectedSeat = null;
    updateSelectedInfo();

    // Update seat grid
    updateSeatGrid();

    // Load reservations for this time slot
    displayReservationsForTimeSlot();

    // Enable submit button check
    validateForm();
}

// ===================================
// Seat Selection
// ===================================
function handleSeatClick(seatNumber) {
    if (!selectedTimeSlot) {
        showError('Por favor selecciona un horario primero');
        return;
    }

    const seat = document.querySelector(`[data-seat-number="${seatNumber}"]`);

    // Don't allow selecting reserved or disabled seats
    if (seat.classList.contains('reserved') || seat.classList.contains('disabled')) {
        return;
    }

    // Get number of people from dropdown
    const numberOfPeople = parseInt(document.getElementById('numberOfPeople').value);

    // Clear previous selection
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('selected'));

    // BUS TOUR LOGIC: Select seats based on number of people
    // Get all available seats in order
    const availableSeats = Array.from(document.querySelectorAll('.seat.available'))
        .map(s => parseInt(s.dataset.seatNumber))
        .sort((a, b) => a - b);

    if (availableSeats.length < numberOfPeople) {
        showError(`Solo hay ${availableSeats.length} asiento(s) disponible(s). Necesitas ${numberOfPeople}.`);
        return;
    }

    // Select the first N available seats (where N = numberOfPeople)
    const seatsToSelect = availableSeats.slice(0, numberOfPeople);

    seatsToSelect.forEach(seatNum => {
        const seatEl = document.querySelector(`[data-seat-number="${seatNum}"]`);
        if (seatEl) {
            seatEl.classList.add('selected');
        }
    });

    // Store selected seats as an array
    selectedSeat = seatsToSelect;

    updateSelectedInfo();
    validateForm();
}

// ===================================
// Update Seat Grid
// ===================================
function updateSeatGrid() {
    const seats = document.querySelectorAll('.seat');

    if (!selectedTimeSlot) {
        // Disable all seats if no time slot selected
        seats.forEach(seat => {
            seat.className = 'seat disabled';
        });
        return;
    }

    // Get reservations for current time slot
    const timeSlotReservations = reservations.filter(r =>
        r.time_slot === selectedTimeSlot &&
        r.reservation_date === currentDate &&
        r.status === 'active'
    );

    const reservedSeats = timeSlotReservations.map(r => r.seat_number);

    // Update seat states
    seats.forEach(seat => {
        const seatNumber = parseInt(seat.dataset.seatNumber);
        seat.classList.remove('disabled', 'reserved', 'available', 'selected');

        if (reservedSeats.includes(seatNumber)) {
            seat.classList.add('reserved');
        } else {
            seat.classList.add('available');
        }
    });

    // Update capacity display
    const availableCount = 10 - reservedSeats.length;
    document.getElementById('availableSeats').textContent = availableCount;

    // Update capacity in time slot buttons
    updateTimeSlotCapacity();
}

// ===================================
// Update Time Slot Capacity
// ===================================
function updateTimeSlotCapacity() {
    const timeSlots = ['11:00', '12:00', '13:00', '14:00'];

    timeSlots.forEach(time => {
        const timeReservations = reservations.filter(r =>
            r.time_slot === time &&
            r.reservation_date === currentDate &&
            r.status === 'active'
        );

        const reserved = timeReservations.length;
        const available = 10 - reserved;

        const capacityEl = document.querySelector(`.capacity[data-time="${time}"]`);
        if (capacityEl) {
            capacityEl.textContent = `${reserved}/10`;
        }

        // Mark as full if no seats available
        const btn = document.querySelector(`.time-slot-btn[data-time="${time}"]`);
        if (btn) {
            if (available === 0) {
                btn.classList.add('full');
            } else {
                btn.classList.remove('full');
            }
        }
    });
}

// ===================================
// Update Selected Info Display
// ===================================
function updateSelectedInfo() {
    document.getElementById('selectedTime').textContent =
        selectedTimeSlot || 'No seleccionado';

    if (Array.isArray(selectedSeat) && selectedSeat.length > 0) {
        document.getElementById('selectedSeat').textContent =
            `${selectedSeat.length} asiento${selectedSeat.length > 1 ? 's' : ''} (${selectedSeat.join(', ')})`;
    } else {
        document.getElementById('selectedSeat').textContent = 'No seleccionado';
    }
}

// ===================================
// Form Validation
// ===================================
function validateForm() {
    const submitBtn = document.getElementById('submitBtn');
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();

    const isValid = selectedTimeSlot && selectedSeat && name && phone;
    submitBtn.disabled = !isValid;
}

// Add input listeners for real-time validation
document.getElementById('customerName').addEventListener('input', validateForm);
document.getElementById('customerPhone').addEventListener('input', validateForm);

// Update seat selection when number of people changes
document.getElementById('numberOfPeople').addEventListener('change', () => {
    // Reset seat selection when number of people changes
    selectedSeat = null;
    document.querySelectorAll('.seat').forEach(s => s.classList.remove('selected'));
    updateSelectedInfo();
    validateForm();
});

// ===================================
// Form Submission
// ===================================
async function handleFormSubmit(e) {
    e.preventDefault();

    const supabase = getSupabaseClient();
    if (!supabase) {
        showError('Supabase no está configurado');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const numberOfPeople = parseInt(document.getElementById('numberOfPeople').value);

    showLoading(true);

    try {
        // BUS TOUR LOGIC: Create reservations for ALL selected seats
        const seatsToReserve = Array.isArray(selectedSeat) ? selectedSeat : [selectedSeat];

        // Check if any seats are already reserved
        const { data: existingReservations } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', currentDate)
            .eq('time_slot', selectedTimeSlot)
            .in('seat_number', seatsToReserve)
            .eq('status', 'active');

        if (existingReservations && existingReservations.length > 0) {
            showError('Algunos asientos ya han sido reservados. Por favor actualiza la página.');
            showLoading(false);
            await loadReservations();
            return;
        }

        // Create multiple reservations (one for each seat)
        const reservationsToCreate = seatsToReserve.map(seatNum => ({
            customer_name: customerName,
            customer_phone: customerPhone,
            number_of_people: numberOfPeople,
            seat_number: seatNum,
            time_slot: selectedTimeSlot,
            reservation_date: currentDate,
            status: 'active'
        }));

        const { data, error } = await supabase
            .from('reservations')
            .insert(reservationsToCreate)
            .select();

        if (error) throw error;

        // Success!
        showSuccess(
            `¡Reserva confirmada para ${customerName}!`,
            `${seatsToReserve.length} asiento${seatsToReserve.length > 1 ? 's' : ''} reservado${seatsToReserve.length > 1 ? 's' : ''} - ${selectedTimeSlot}`
        );

        // Reset form
        document.getElementById('reservationForm').reset();
        selectedSeat = null;
        updateSelectedInfo();
        validateForm();

        // Reload reservations
        await loadReservations();

    } catch (error) {
        console.error('Error creating reservation:', error);
        showError('Error al crear la reserva: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===================================
// Load Reservations from Supabase
// ===================================
async function loadReservations() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', currentDate)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;

        reservations = data || [];
        updateSeatGrid();
        displayReservationsForTimeSlot();

    } catch (error) {
        console.error('Error loading reservations:', error);
        showError('Error al cargar las reservas: ' + error.message);
    }
}

// ===================================
// Display Reservations List
// ===================================
function displayReservationsForTimeSlot() {
    const listContainer = document.getElementById('reservationsList');

    if (!selectedTimeSlot) {
        listContainer.innerHTML = '<p class="no-reservations">Seleccione un horario para ver las reservas</p>';
        return;
    }

    const timeSlotReservations = reservations.filter(r =>
        r.time_slot === selectedTimeSlot &&
        r.reservation_date === currentDate &&
        r.status === 'active'
    );

    if (timeSlotReservations.length === 0) {
        listContainer.innerHTML = '<p class="no-reservations">No hay reservas para este horario</p>';
        return;
    }

    // Group reservations by customer (phone number as unique identifier)
    const groupedReservations = {};
    timeSlotReservations.forEach(reservation => {
        const key = reservation.customer_phone;
        if (!groupedReservations[key]) {
            groupedReservations[key] = {
                customer_name: reservation.customer_name,
                customer_phone: reservation.customer_phone,
                number_of_people: reservation.number_of_people,
                seats: [],
                ids: []
            };
        }
        groupedReservations[key].seats.push(reservation.seat_number);
        groupedReservations[key].ids.push(reservation.id);
    });

    // Display grouped reservations
    listContainer.innerHTML = Object.values(groupedReservations).map(group => {
        const sortedSeats = group.seats.sort((a, b) => a - b);
        return `
        <div class="reservation-item">
          <div class="reservation-info">
            <div class="reservation-name">${group.customer_name}</div>
            <div class="reservation-details">
              📞 ${group.customer_phone} | 
              👥 ${group.number_of_people} ${group.number_of_people === 1 ? 'persona' : 'personas'}
            </div>
          </div>
          <div class="reservation-seats-group">
            <div class="seats-label">Asientos:</div>
            <div class="seats-numbers">${sortedSeats.join(', ')}</div>
          </div>
          <button class="btn-cancel" onclick="cancelBusTourReservation('${group.customer_phone}')">
            Cancelar
          </button>
        </div>
      `;
    }).join('');
}

// ===================================
// Cancel Reservation (Bus Tour - cancels all seats for customer)
// ===================================
async function cancelBusTourReservation(customerPhone) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva? Se cancelarán TODOS los asientos del cliente.')) {
        return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    showLoading(true);

    try {
        // Cancel all reservations for this customer on this date/time
        const { error } = await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('customer_phone', customerPhone)
            .eq('reservation_date', currentDate)
            .eq('time_slot', selectedTimeSlot);

        if (error) throw error;

        await loadReservations();

    } catch (error) {
        console.error('Error cancelling reservation:', error);
        showError('Error al cancelar la reserva: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===================================
// Realtime Subscription
// ===================================
function setupRealtimeSubscription() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Subscribe to reservation changes
    realtimeChannel = supabase
        .channel('reservations-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'reservations'
            },
            (payload) => {
                console.log('Realtime update:', payload);
                loadReservations();
            }
        )
        .subscribe();

    console.log('✅ Realtime subscription active');
}

// ===================================
// UI Helper Functions
// ===================================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function showSuccess(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('modalMessage').textContent = message;
    modal.querySelector('h2').textContent = title;
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('successModal').classList.remove('show');
}

function showError(message) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorMessage').textContent = message;
    modal.classList.add('show');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('show');
}

// Close modals on background click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});
