/**
 * Pure reconfirmation window logic.
 * Calculates reconfirmation deadline and reminder schedules based on trip and match timestamps.
 */
export interface ReconfirmationSchedule {
	windowHours: number;
	windowMs: number;
	deadlineDate: Date;
	reminderDates: Date[];
}

export function calculateReconfirmSchedule(
	tripDateTimeStr: string,
	matchTimeStr: string
): ReconfirmationSchedule {
	const tripTime = new Date(tripDateTimeStr).getTime();
	const matchTime = new Date(matchTimeStr).getTime();

	if (isNaN(tripTime) || isNaN(matchTime)) {
		throw new Error('Invalid trip or match datetime string');
	}

	const diffHours = (tripTime - matchTime) / (1000 * 60 * 60);

	let windowHours = 24;
	let reminderOffsets: number[] = [12, 2]; // hours remaining before deadline

	if (diffHours >= 72) {
		windowHours = 24;
		reminderOffsets = [12, 2];
	} else if (diffHours >= 48) {
		windowHours = 12;
		reminderOffsets = [6, 2];
	} else if (diffHours >= 24) {
		windowHours = 12; // 24-48h tier uses 12h max window cap
		reminderOffsets = [6, 2];
	} else {
		windowHours = Math.max(0.5, Math.min(2, diffHours)); // max 2h window, or time remaining until departure
		reminderOffsets = [1]; // 1 hour remaining for under 24hr window
	}

	const windowMs = windowHours * 60 * 60 * 1000;
	const deadlineTime = matchTime + windowMs;
	const deadlineDate = new Date(deadlineTime);

	// Calculate and filter reminder dates
	const reminderDates: Date[] = [];
	for (const offsetHours of reminderOffsets) {
		const reminderTime = deadlineTime - offsetHours * 60 * 60 * 1000;
		// Only schedule if the reminder time is strictly after the match detection time
		// and before the deadline itself.
		if (reminderTime > matchTime && reminderTime < deadlineTime) {
			reminderDates.push(new Date(reminderTime));
		}
	}

	// Sort reminder dates chronologically
	reminderDates.sort((a, b) => a.getTime() - b.getTime());

	return {
		windowHours,
		windowMs,
		deadlineDate,
		reminderDates
	};
}

/**
 * Calculates referring captain priority window length in hours based on time until trip departure.
 * > 7 days (168h) out -> 12 hours
 * 3 to 7 days (72h to 168h) out -> 6 hours
 * 48 to 72 hours out -> 2 hours
 * < 48 hours out -> 0.5 hours (30 minutes)
 */
export function calculateCaptainPriorityHours(
	tripDateTimeStr: string,
	currentTimeStr: string = new Date().toISOString()
): number {
	const tripTime = new Date(tripDateTimeStr).getTime();
	const currentTime = new Date(currentTimeStr).getTime();
	const diffHours = (tripTime - currentTime) / (1000 * 60 * 60);

	if (diffHours >= 168) {
		return 12;
	} else if (diffHours >= 72) {
		return 6;
	} else if (diffHours >= 48) {
		return 2;
	} else {
		return 0.5;
	}
}

