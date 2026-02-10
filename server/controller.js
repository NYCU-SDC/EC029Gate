import gpiod from "node-libgpiod";

const RELAY_PIN = Number(process.env.RELAY_GPIO_PIN ?? 17);
const UNLOCK_DURATION = 8000;

let chip = null;
let line = null;
let unlockTimer = null;
let gpioAvailable = false;

export function initGPIO() {
	if (gpioAvailable || chip !== null) return;

	try {
		chip = new gpiod.Chip("gpiochip0");
		line = chip.getLine(RELAY_PIN);

		line.requestOutput("fox-lair", 0);
		gpioAvailable = true;

		console.log(`[GPIO] initialized (libgpiod) on BCM ${RELAY_PIN}`);
	} catch (err) {
		gpioAvailable = false;
		chip = null;
		line = null;
		console.warn("[GPIO] unavailable, running in simulation mode:", err.message);
	}
}

export function unlockDoor() {
	return new Promise(resolve => {
		if (!gpioAvailable) {
			console.log("[GPIO] simulate unlock");
			resolve({ simulated: true });
			return;
		}

		if (unlockTimer) clearTimeout(unlockTimer);

		line.setValue(1);
		console.log("[GPIO] door unlocked");

		unlockTimer = setTimeout(() => {
			line.setValue(0);
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

	line.setValue(0);
	console.log("[GPIO] door locked (manual)");
	return { success: true };
}

export function getDoorStatus() {
	if (!gpioAvailable) {
		return {
			available: false,
			locked: true,
			simulated: true
		};
	}

	return {
		available: true,
		locked: line.getValue() === 0,
		autoLockActive: unlockTimer !== null
	};
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

function cleanup() {
	if (gpioAvailable) {
		try {
			line.setValue(0);
			line.release();
			chip.close();
		} catch {}
	}
	process.exit(0);
}
