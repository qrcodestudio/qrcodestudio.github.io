$(document).ready(function () {
	const kPrefsAppKey = '.QRCodeScanCounters';
	const kClassHidden = 'visually-hidden';
	const kScansPerDay2024 = 44770000.0;
	const kAnnualGrowth = 0.18;
	const kScansPerSecond = kScansPerDay2024 * (1 + kAnnualGrowth) ** ((new Date()).getFullYear() - 2024) / (24 * 60 * 60);
	const kVisitStartDate = new Date();
	const kCountryShares = [
		{code: '',  share: 100.00, flag: '🌎', name: 'World'},
		{code: 'US', share: 38.31, flag: '🇺🇸', name: 'United States'},
		{code: 'IN', share: 13.48, flag: '🇮🇳', name: 'India'},
		{code: 'CN', share:  4.28, flag: '🇨🇳', name: 'China'},
		{code: 'TR', share:  3.64, flag: '🇹🇷', name: 'Turkey'},
		{code: 'FR', share:  3.14, flag: '🇫🇷', name: 'France'},
		{code: 'UK', share:  3.08, flag: '🇬🇧', name: 'United Kingdom'},
		{code: 'CA', share:  2.30, flag: '🇨🇦', name: 'Canada'},
		{code: 'DE', share:  1.91, flag: '🇩🇪', name: 'Germany'},
		{code: 'SA', share:  1.57, flag: '🇸🇦', name: 'Saudi Arabia'},
		{code: 'PH', share:  1.36, flag: '🇵🇭', name: 'Philippines'},
		{code: 'SG', share:  1.25, flag: '🇸🇬', name: 'Singapore'},
		{code: 'MY', share:  1.11, flag: '🇲🇾', name: 'Malaysia'},
		{code: 'HK', share:  1.07, flag: '🇭🇰', name: 'Hong Kong'},
		{code: 'AU', share:  1.03, flag: '🇦🇺', name: 'Australia'},
		{code: 'NL', share:  0.97, flag: '🇳🇱', name: 'Netherlands'}
	];
	const kTypeShares = {
		'URL' : 54.33,
		'File' : 20.61,
		'vCard' : 15.13,
		'Link Page' : 2.57,
		'MP3' : 2.29,
		'Landing Page' : 1.51,
		'App Store' : 0.95,
		'Google Form' : 0.74,
		'Menu' : 0.48,
		'Text' : 0.38
	};
	const kAnniversaries = [
		{ "group": "US", "uid": "independenceDay", "name": "Independence Day", "date": "2025-07-04" },
		{ "group": "US", "uid": "juneteenth", "name": "Juneteenth", "date": "2025-06-19" },
		{ "group": "US", "uid": "patriotDay", "name": "Patriot Day", "date": "2025-09-11" },
		{ "group": "US", "uid": "veteransDay", "name": "Veterans Day", "date": "2025-11-11" },
		{ "group": "US", "uid": "constitutionDay", "name": "Constitution Day", "date": "2025-09-17" },
		{ "group": "International", "uid": "newYearsDay", "name": "New Year's Day", "date": "2025-01-01" },
		{ "group": "International", "uid": "internationalWomensDay", "name": "International Women's Day", "date": "2025-03-08" },
		{ "group": "International", "uid": "earthDay", "name": "Earth Day", "date": "2025-04-22" },
		{ "group": "International", "uid": "worldHealthDay", "name": "World Health Day", "date": "2025-04-07" },
		{ "group": "International", "uid": "internationalWorkersDay", "name": "International Workers' Day", "date": "2025-05-01" },
		{ "group": "International", "uid": "worldEnvironmentDay", "name": "World Environment Day", "date": "2025-06-05" },
		{ "group": "International", "uid": "internationalDayOfPeace", "name": "International Day of Peace", "date": "2025-09-21" },
		{ "group": "International", "uid": "worldFoodDay", "name": "World Food Day", "date": "2025-10-16" },
		{ "group": "International", "uid": "universalChildrensDay", "name": "Universal Children's Day", "date": "2025-11-20" },
		{ "group": "International", "uid": "worldAIDSDay", "name": "World AIDS Day", "date": "2025-12-01" },
		{ "group": "Funny", "uid": "piDay", "name": "Pi Day", "date": "2025-03-14" },
		{ "group": "Funny", "uid": "talkLikeAPirateDay", "name": "Talk Like a Pirate Day", "date": "2025-09-19" },
		{ "group": "Funny", "uid": "sillyWalkDay", "name": "Silly Walk Day", "date": "2025-01-07" },
		{ "group": "Funny", "uid": "starWarsDay", "name": "Star Wars Day", "date": "2025-05-04" },
		{ "group": "Funny", "uid": "internationalCatDay", "name": "International Cat Day", "date": "2025-08-08" },
		{ "group": "Funny", "uid": "worldEmojiDay", "name": "World Emoji Day", "date": "2025-07-17" },
		{ "group": "Funny", "uid": "leftHandersDay", "name": "Left-Handers Day", "date": "2025-08-13" },
		{ "group": "Funny", "uid": "towelDay", "name": "Towel Day", "date": "2025-05-25" },
		{ "group": "Funny", "uid": "cheesePizzaDay", "name": "Cheese Pizza Day", "date": "2025-09-05" },
		{ "group": "Funny", "uid": "nationalPizzaDay", "name": "National Pizza Day", "date": "2025-02-09" },
		{ "group": "Funny", "uid": "internationalCoffeeDay", "name": "International Coffee Day", "date": "2025-10-01" },
		{ "group": "Funny", "uid": "internationalJokeDay", "name": "International Joke Day", "date": "2025-07-01" },
		{ "group": "Funny", "uid": "worldUFODay", "name": "World UFO Day", "date": "2025-07-02" },
		{ "group": "Funny", "uid": "answerThePhoneLikeBuddyTheElfDay", "name": "Answer the Phone Like Buddy the Elf Day", "date": "2025-12-18" },
		{ "group": "Funny", "uid": "nationalDressUpYourPetDay", "name": "National Dress Up Your Pet Day", "date": "2025-01-14" },
		{ "group": "Funny", "uid": "globalBeatlesDay", "name": "Global Beatles Day", "date": "2025-06-25" },
		{ "group": "Funny", "uid": "worldNutellaDay", "name": "World Nutella Day", "date": "2025-02-05" },
		{ "group": "Funny", "uid": "internationalLEGODay", "name": "International LEGO Day", "date": "2025-01-28" },
		{ "group": "Funny", "uid": "nationalMargaritaDay", "name": "National Margarita Day", "date": "2025-02-22" },
		{ "group": "Funny", "uid": "nationalNothingDay", "name": "National Nothing Day", "date": "2025-01-16" },
		{ "group": "Funny", "uid": "worldGothDay", "name": "World Goth Day", "date": "2025-05-22" }
	];

	const kUIFunFactLabel = $('#qr-fun-fact-label');
	const kUIFunFactContent = $('#qr-fun-fact-content');
	const kUIScanCounterPage = $('#qr-scan-counter-page');
	const kUIScanCounterMonth = $('#qr-scan-counter-month');
	const kUIScanCounterYear = $('#qr-scan-counter-year');
	const kUIScanAreaSelector = $('#qr-scan-area-selector');
	const kUIAnniversaryName = $('.qr-anniversary-name');
	const kUIAnniversaryDate = $('.qr-anniversary-date');
	const kUIAnniversariesContainer = $('#qr-anniversaries-container');
	const kUIFluffItems = $('.qr-ui-fluff');
	const kUIDarkThemeItems = $('[data-bs-theme]');
	const kUIPrefsDarkMode = $('[name="qr-ui-prefs-darkmode"]');
	const kUIPrefsHideFluff = $('#qr-ui-prefs-nofluff');

	let gAreaCode = prefsRead('areaCode', '');
	let gAnniversaryNames = ['', '', ''];
	let gAnniversaryDates = ['', '', ''];
	let gUserAnniversary = 0;
	let gFunFacts = [];

	[0, 1, 2].forEach((idx) => {
		gAnniversaryNames[idx] = prefsRead(`anniversaryName-${idx}`, ['Pi Day', 'Talk Like a Pirate Day', 'Silly Walk Day'][idx]);
		gAnniversaryDates[idx] = prefsRead(`anniversaryDate-${idx}`, ['2025-03-14', '2025-09-19', '2025-01-07'][idx]);
	});

	kUIScanAreaSelector.on('change', function() {
		gAreaCode = $(this).val();
		prefsSave('areaCode', gAreaCode);
	});
	kUIAnniversaryName.on('change', function() {
		const idx = $(this).data('qr-anniversary-idx');
		const val = $(this).val();
		gAnniversaryNames[idx] = val;
		prefsSave(`anniversaryName-${idx}`, val);
	});
	kUIAnniversaryDate.on('change', function() {
		const idx = $(this).data('qr-anniversary-idx');
		const val = $(this).val();
		gAnniversaryDates[idx] = val;
		prefsSave(`anniversaryDate-${idx}`, val);
	});
	$(document).on('click', '.qr-anniversary-item', function() {
		const date = $(this).data('qr-date');
		const name = $(this).data('qr-name');
		const idx = gUserAnniversary++ % 3;
		gAnniversaryDates[idx] = date;
		gAnniversaryNames[idx] = name;
		prefsSave(`anniversaryName-${idx}`, name);
		prefsSave(`anniversaryDate-${idx}`, date);
		uiUserAnniversary(idx);
	});
	kUIPrefsDarkMode.on('click', function() {
		const mode = $(this).val();
		prefsSave('uiDarkMode', mode);
		uiDarkMode(mode);
	});
	kUIPrefsHideFluff.on('change', function() {
		const state = $(this).is(':checked');
		prefsSave('uiHideFluff', state);
		uiHideFluff(state);
	});

	function prefsRead(key, value) {
		return window.localStorage.getItem(`QRCodeStudioApp${kPrefsAppKey}-${key}`) || value;
	}
	function prefsSave(key, value) {
		window.localStorage.setItem(`QRCodeStudioApp${kPrefsAppKey}-${key}`, value);
	}

	function initUI() {
		uiDarkMode(prefsRead('uiDarkMode', 'auto'));
		uiHideFluff((/true/i).test(prefsRead('uiHideFluff', false)));
		kUIScanAreaSelector.html(kCountryShares.map((country) => {
			return `<option value="${country.code}"${country.code == gAreaCode ? ' selected' : ''}>${country.flag} ${country.name}</option>`;
		}));
		[0, 1, 2].forEach((idx) => { uiUserAnniversary(idx); });
	};
	function initFunFacts() {
		if (gFunFacts.length == 0) {
			$('[data-qr-funfact-label]').each(function() {
				const idx = $(this).data('qr-funfact-label');
				const label = $(this).html();
				const fact = $(`[data-qr-funfact-content="${idx}"]`).html();
				gFunFacts.push([label, fact]);
			});
			gFunFacts.sort( () => .5 - Math.random() );
		}
		const [label, fact] = gFunFacts.pop();
		kUIFunFactLabel.html(label);
		kUIFunFactContent.html(fact);
		setTimeout(initFunFacts, 9630);
	}
	function initAnniversaries() {
		const groups = [...new Set(kAnniversaries.map(a => a.group))];
		const html = groups.map((group) => {
			const header = `<div class="fw-bold fs-6 mb-1">${group}</div>`;
			const items = kAnniversaries.filter(item => item.group == group).map(item => `<tr role="button" class="qr-anniversary-item" data-qr-date="${item.date}" data-qr-name="${item.name}"><td class="font-monospace text-nowrap px-2 w-auto">${item.date.split('-').slice(1).join('-')}</td><td class="w-100 fw-bold text-wrap text-break">${item.name}</td></tr>`).join('');
			return `${header}<table class="table table-sm table-bordered table-striped table-hover small mt-0 mb-2"><tbody>${items}</tbody></table>`;
		}).join('');
		kUIAnniversariesContainer.empty().html(html);
	}

	function uiUserAnniversary(idx) {
		$(`.qr-anniversary-name[data-qr-anniversary-idx="${idx}"]`).val(gAnniversaryNames[idx]);
		$(`.qr-anniversary-date[data-qr-anniversary-idx="${idx}"]`).val(gAnniversaryDates[idx]);
	}
	function uiDarkMode(mode) {
		kUIPrefsDarkMode.filter(`[value="${mode}"]`).prop('checked', true);

		let theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		switch(mode) {
			case 'on':
				theme = 'dark'; break;
			case 'off':
				theme = 'light'; break;
		}
		kUIDarkThemeItems.attr('data-bs-theme', theme);
	}
	function uiHideFluff(state) {
		kUIPrefsHideFluff.prop('checked', state);

		if (state === true) {
			if (!kUIFluffItems.hasClass(kClassHidden)) kUIFluffItems.addClass(kClassHidden);
		} else {
			if (kUIFluffItems.hasClass(kClassHidden)) kUIFluffItems.removeClass(kClassHidden);
		}
	}

	function countersAnimationLoop() {
		updateCounters();
		requestAnimationFrame(countersAnimationLoop);
	}
	function updateCounters() {
		const now = new Date();
		const currentYear = now.getFullYear();
		const firstDayOfMonth = new Date(currentYear, now.getMonth(), 1);
		const firstDayOfYear = new Date(currentYear, 0, 1);
		
		const timeSinceVisitStartInSeconds = (now - kVisitStartDate) / 1000;
		const timeSinceMonthStartInSeconds = (now - firstDayOfMonth) / 1000;
		const timeSinceYearStartInSeconds = (now - firstDayOfYear) / 1000;

		const countryShare = ((kCountryShares.find(country => country.code == gAreaCode) || {}).share || 100) / 100;

		kUIScanCounterPage.text(Math.round(timeSinceVisitStartInSeconds * kScansPerSecond * countryShare).toLocaleString());
		kUIScanCounterMonth.text(Math.round(timeSinceMonthStartInSeconds * kScansPerSecond * countryShare).toLocaleString());
		kUIScanCounterYear.text(Math.round(timeSinceYearStartInSeconds * kScansPerSecond * countryShare).toLocaleString());

		[0, 1, 2].forEach((idx) => {
			const targetDate = new Date(gAnniversaryDates[idx]);
			const targetMonth = targetDate.getMonth();
			const targetDay = targetDate.getDate();

			let thisYearTarget = new Date(currentYear, targetMonth, targetDay);
			let lastYearTarget;
			let nextYearTarget;
			if (thisYearTarget < now) {
				lastYearTarget = thisYearTarget;
				nextYearTarget = new Date(currentYear + 1, targetMonth, targetDay);
			} else {
				lastYearTarget = new Date(currentYear - 1, targetMonth, targetDay);
				nextYearTarget = thisYearTarget;
			}
			const secondsToLast = (now - lastYearTarget) / 1000;
			const secondsToNext = (nextYearTarget - now) / 1000;

			$(`#qr-scan-counter-anniversary-${idx}-from`).text(Math.round(secondsToLast * kScansPerSecond * countryShare).toLocaleString());
			$(`#qr-scan-counter-anniversary-${idx}-to`).text(Math.round(secondsToNext * kScansPerSecond * countryShare).toLocaleString());
		});
	}

	initUI();
	initFunFacts();
	initAnniversaries();
	countersAnimationLoop();
});
