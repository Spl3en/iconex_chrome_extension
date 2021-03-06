import NotificationManager from 'lib/notification-manager.js'
const notificationManager = new NotificationManager();
let TAB_ARR = [];
let IS_LOCKED = _initIsAppLocked();
let TIMER;
let TIMER_TIME = 60000 * 10;
//let TIMER_TIME = 5000;

window.chrome.browserAction.setPopup({ popup: './popup.html' })

window.chrome.runtime.onConnect.addListener(portFrom => {
	if (portFrom.name === 'iconex-background-content') {
		portFrom.onMessage.addListener(message => {
			const { type } = message
			const popupId = notificationManager.getPopupId()
			switch (type) {
				case 'REQUEST_ADDRESS':
					if (popupId) window.chrome.extension.sendMessage({ type })
					else notificationManager.showPopup({ type })
					break;

				case 'REQUEST_TRANSACTION':
					const { payload } = message
					if (popupId) window.chrome.extension.sendMessage({ type, payload })
					else notificationManager.showPopup({ type, payload: JSON.stringify(payload) })
					break;

				default:
			}
		});
	}
});

// if every tab closed, lock the app
window.chrome.tabs.onRemoved.addListener((tabId) => {
	// remove tab id
	const index = TAB_ARR.indexOf(tabId);
  if (index !== -1) TAB_ARR.splice(index, 1);
	// if tabArr empty, lock the app
	if (TAB_ARR.length < 1) {
		_setLockState(true);
	}
});

window.chrome.runtime.onMessage.addListener(message => {
	const { type } = message
	console.log(message)
	switch (type) {
		case 'ADD_TAB_ID':
			if(TAB_ARR.indexOf(message.payload) === -1) {
				TAB_ARR.push(message.payload);
			}
			break;
		case 'LOCK':
			if (TIMER) clearInterval(TIMER);
			TIMER = _setTimer();
			break;
		case 'UNLOCK':
			_setLockState(false);
			if (TIMER) clearInterval(TIMER);
			TIMER = _setTimer();
			break;
		case 'CLEAR_LOCK':
			if (TIMER) clearInterval(TIMER);
			break;
		case 'RESET_TIMER':
			if (!_isPasscodeExist()) return;
			if (TIMER) clearInterval(TIMER);
			TIMER = _setTimer();
			break;
		case 'CHECK_APP_LOCK_STATE':
			IS_LOCKED = _checkIsAppLocked();
			window.chrome.extension.sendMessage({ type: type + '_FULFILLED', payload: IS_LOCKED });
			break;
		case 'CHECK_POPUP_LOCK_STATE':
			IS_LOCKED = _checkIsPopupLocked();
			window.chrome.extension.sendMessage({ type: type + '_FULFILLED', payload: IS_LOCKED });
			break;
		case 'CLOSE_POPUP':
			notificationManager.closePopup()
			break;
		case 'REFRESH_LOCK_STATE':
			console.log(type, message.payload)
			window.chrome.extension.sendMessage({ type: type + '_FULFILLED', payload: message.payload });
			break;
		default:
			break;
	}
});


function _setTimer() {
	let end = false;
	let timer = setInterval(function() {
	  if (end) {
			_setLockState(true);
			clearInterval(timer);
		}
		end = true;
	}, TIMER_TIME);
	return timer;
}

function _initIsAppLocked() {
	const isLocked = _isPasscodeExist();
	return isLocked
}

function _checkIsAppLocked() {
	const passcodeHash = localStorage.getItem('redux') ? JSON.parse(localStorage.getItem('redux')).global.passcodeHash : false;
	const isLocked = passcodeHash	? IS_LOCKED : false
	console.log(passcodeHash, TAB_ARR, isLocked)
	return isLocked
}

function _checkIsPopupLocked() {
	if (TAB_ARR.length > 0) {
		return IS_LOCKED
	} else {
		const passcodeHash = localStorage.getItem('redux') ? JSON.parse(localStorage.getItem('redux')).global.passcodeHash : false;
		console.log(passcodeHash)
		return !!passcodeHash
	}
}

function _setLockState(lockState) {
	IS_LOCKED = (localStorage.getItem('redux') && JSON.parse(localStorage.getItem('redux')).global.passcodeHash) ? lockState : false
	window.chrome.extension.sendMessage({ type: 'SET_LOCK_STATE', payload: IS_LOCKED })
}

function _isPasscodeExist() {
	return (localStorage.getItem('redux') && JSON.parse(localStorage.getItem('redux')).global.passcodeHash) ? true : false
}
