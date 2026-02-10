import { execFileSync } from "node:child_process";

const RELAY_PIN = Number(process.env.RELAY_GPIO_PIN ?? 17);
const UNLOCK_DURATION = 8000;

let unlockTimer = null;
let gpioAvailable = true;
let currentValue = 0;

function gpiodSet(value) {
	try {
		// 不要 daemonize，讓 Node process 持有 GPIO
		execFileSync("gpioset", [
			"gpiochip0",
			`${RELAY_PIN}=${value}`
		]);
		currentValue = value;
	} catch (err) {
		gpioAvailable = false;
		console.warn("[GPIO] gpiod unavailable, fallback to simulation:", err.message);
	}
}

export function initGPIO() {
	try {
		gpiodSet(0);
		console.log(`[GPIO] initialized via gpiod (BCM ${RELAY_PIN})`);
	} catch {
		gpioAvailable = false;
	}
}

export function unlockDoor() {
	return new Promise((resolve) => {
		if (!gpioAvailable) {
			console.log("[GPIO] simulate unlock");
			resolve({ simulated: true });
			return;
		}

		if (unlockTimer) clearTimeout(unlockTimer);

		gpiodSet(1);
		console.log("[GPIO] door unlocked");

		unlockTimer = setTimeout(() => {
			gpiodSet(0);
			unlockTimer = null;
			console.log("[GPIO] door locked (auto)");
		}, UNLOCK_DURATION);

		resolve({ success: true, duration: UNLOCK_DURATION });
	});
}

export function lockDoor() {
	if (!gpioAvailable) {
		console.log("[GPIO] simulate lock");
		return { simulated: true };
	}

	if (unlockTimer) {
		clearTimeout(unlockTimer);
		unlockTimer = null;
	}

	gpiodSet(0);
	console.log("[GPIO] door locked (manual)");
	return { success: true };
}

export function getDoorStatus() {
	return {
		available: gpioAvailable,
		locked: currentValue === 0,
		autoLockActive: unlockTimer !== null
	};
}
