$(function(){

	////////VARIABLES///////////////////

	//object variables
	var 
		h = $(window).height(),
		w = $(window).width(),
		clock = $('#clock'),
		alarm = clock.find('.alarm'),
		ampm = clock.find('.ampm'),
		dialog = $('#alarm-dialog'),
		dialog_p = dialog.parent(),
		alarm_set = $('#alarm-set'),
		alarm_clear = $('#alarm-clear'),
		alarm_box = $('#alarm-box'),
		time_is_up = $('#time-is-up'),
		time_is_up_p = time_is_up.parent();

	//movement variables and states
	var 
		alarmbox = false,
		clock_move_1 = .1,
		clock_move_2 = .2;
		toggle_move = 70;

	//alarm variables
	var
		alarm_counter = [-1, -1, -1], //the counters for the 3 alarms
		alarm_viewer = ["00:00:00", "00:00:10", "00:00:20"]; 
		current_alarm = 0; //the current location of the alarm that you are changing

	// Map digits to their names (this will be an array)
	var digit_to_name = 'zero one two three four five six seven eight nine'.split(' ');

	// This object will hold the digit elements
	var digits = {};

	// Positions for the hours, minutes, and seconds
	var positions = [
		'h1', 'h2', ':', 'm1', 'm2', ':', 's1', 's2'
	];

	// Generate the digits with the needed markup,
	// and add them to the clock

	var digit_holder = clock.find('.digits');

	$.each(positions, function(){
		if(this == ':'){
			digit_holder.append('<div class="dots">');
		}
		else{
			var pos = $('<div>');
			for(var i=1; i<8; i++){
				pos.append('<span class="d' + i + '">');
			}
			// Set the digits as key:value pairs in the digits object
			digits[this] = pos;
			// Add the digit elements to the page
			digit_holder.append(pos);
		}
	});

	// Add the weekday names

	var weekday_names = 'MON TUE WED THU FRI SAT SUN'.split(' '),
		weekday_holder = clock.find('.weekdays');

	$.each(weekday_names, function(){
		weekday_holder.append('<span>' + this + '</span>');
	});

	var weekdays = clock.find('.weekdays span');

	function pxToFloat(PX){
		return parseFloat(PX.split("px"));
	}

	///////////////CONFIGURE//////////////////////

	function configure(){
		//widow dimentions
		h = $(window).height();
		w = $(window).width();

		//keep the footer at the bottom
		alarm_box.css({ top: h - 50 });

		//width constrained elements
		var padding_left = pxToFloat(clock.css("padding-left"));
		var padding_right = pxToFloat(clock.css("padding-right"));
		var padding = padding_right + padding_left;
		var cWidth = 370 - padding;
		var left = w /2 - cWidth/2 + padding_left;
		if(w < 370){
			cWidth = w - padding;
			left = 0;
		}
		clock.css({ width: cWidth});
		clock.css({ left: left});

		//height constrained elements
		var dTop = 200; // dialogue top
		var dHeight = 375; //dialog height
		var saPadding = 50; //"set alarm" padding (#alarm-dialog h2)
		var adc = $("#alarm-dialog .close"); //the close button on dialog
		var check = $("#alarm-dialog .check");
		var ccTop = 40; //close check top
		if(h < 400){ //landscape mode
			clock_move_1 = .2;
			clock_move_2 = clock_move_1;
			dTop = 10;
			ccTop = 25;
			dHeight = h - dTop * 2;
			saPadding = 30;
		}
		else if ( dTop + dHeight > h) { //really small device
			dTop = h - dHeight; //make bottom at bottom
		}
		else{
			clock_move_2 = .2;
			clock_move_1 = clock_move_2 * .4;
		}
		dialog.css({top: dTop});
		dialog.css({height: dHeight});
		time_is_up.css({top: dTop});
		$("#alarm-dialog h2").css({"padding-top": saPadding});
		$("#alarm-dialog h2").css({"padding-bottom": saPadding});
		adc.css({top: ccTop});
		check.css({top: ccTop});

		//other constraints
		var dWidth = pxToFloat(dialog.css("width")); //Dialog width
		var adcRight = 35;
		var checkLeft = 35;
		if ( dWidth > w ) { //if the width is wider than the screen so the close is not visible
			adcRight = dWidth/2 - w/2 + 20; //make the close be 10px from edge
			checkLeft = dWidth/2 - w/2 + 20;
		}
		adc.css({ right: adcRight});
		check.css({ left: checkLeft});
	};

	/////////////////////BREAKTIME//////////////////////
	function breakTime(time){
		/* breaks the alarm_counter into h/m/s components*/
		var break_time = [0, 0, 0];
		break_time[0] = Math.floor(time/3600);
		time = time%3600;

		break_time[1] = Math.floor(time/60);
		time = time%60;

		break_time[2]=time;

		return break_time;
	}

	function activateAlarmButton(bool, theButton, theID){
		if(bool == true){
			theButton.addClass("active");
			theButton.children('h2').text(alarm_viewer[theID]);
		}
		else{
			theButton.removeClass("active");
			theButton.children('h2').text("new Alarm");
		}
	}

	$( window ).resize(configure); //When you flip the phone configure it
	configure(); //configure it at the start

	//////////////UPDATE TIME///////////////////////////
	(function update_time(){
		// Runs a timer every second and update the clock

		// Use moment.js to output the current time as a string
		// hh is for the hours in 12-hour format,
		// mm - minutes, ss-seconds (all with leading zeroes),
		// d is for day of week and A is for AM/PM

		var now = moment().format("hhmmssdA");

		digits.h1.attr('class', digit_to_name[now[0]]);
		digits.h2.attr('class', digit_to_name[now[1]]);
		digits.m1.attr('class', digit_to_name[now[2]]);
		digits.m2.attr('class', digit_to_name[now[3]]);
		digits.s1.attr('class', digit_to_name[now[4]]);
		digits.s2.attr('class', digit_to_name[now[5]]);

		// The library returns Sunday as the first day of the week.
		// Stupid, I know. Lets shift all the days one position down, 
		// and make Sunday last

		var dow = now[6];
		dow--;
		
		// Sunday!
		if(dow < 0){
			// Make it last
			dow = 6;
		}

		// Mark the active day of the week
		weekdays.removeClass('active').eq(dow).addClass('active');

		// Set the am/pm text:
		ampm.text(now[7]+now[8]);

		// Is there an alarm set?
		var alarms_active = 0;
		var parent_button;
		for(var i = 0; i < alarm_counter.length; i++){
			//make the countdown show 
			if(alarm_counter[i] > 0){ //if you are counting
				var break_time = breakTime(alarm_counter[i]);
				//make there be 0's before single digits
				for (var y = 0; y < break_time.length; y++){
					break_time[y] = String(break_time[y]);
					if(break_time[y].length < 2) break_time[y] = "0" + break_time[y];
				}
				alarm_viewer[i] = break_time[0] + ":" + break_time[1] + ":" + break_time[2];
			} 
			else{ //if you are making the alarm now or otherwise
				alarm_viewer[i] = "00:00:00";
			}
			var button = $("#" + String(i));
			if(button.parent().hasClass("active")){
				button.text(alarm_viewer[i]);
			}

			//check to see if the counter is done
			parent_button = $("#" + String(i)).parent();
			if(alarm_counter[i] >= 1){
				
				// Decrement the counter with one second
				alarm_counter[i]--;
				alarms_active++;
				parent_button.removeClass('hidden');
			}
			else if(alarm_counter[i] >= 0){
				time_is_up_p.fadeIn();
				clock.velocity({translateY: - h * clock_move_2}, 300);

				alarm_counter[i] = -1;
				alarms_active++;
				parent_button.removeClass('hidden');

				current_alarm = i;
 
				// Play the alarm sound. This will fail
				// in browsers which don't support HTML5 audio
				try{
					$('#alarm-ring')[0].play();
				}
				catch(e){}
			}
			else{
				if(i > alarms_active){ //if there are more than one inactive alarms
					parent_button.addClass('hidden'); //hide this alarm
				}
				else{
					parent_button.removeClass('hidden'); //show alarm
				}
			}
		}
		//check to see if you have the alarm icon on or not
		if( alarms_active > 0 ){ 
			alarm.addClass('active');
		} else {
			alarm.removeClass('active');
		}

		//change how much the alarm_box moves to show all buttons
		if(alarms_active < alarm_counter.length - 1){
		toggle_move = 70 + alarms_active * 50;
		}
		else{
		toggle_move = 70 + (alarm_counter.length - 1) * 50 + 10;	
		}

		// Schedule this function to be run again in 1 sec
		setTimeout(update_time, 1000);

	})();

	/////////////JQUERY CLICKS////////////////////////

	// Switch the theme
	$('#switch-theme').click(function(){
		clock.toggleClass('light dark');
	});


	//////////////ALARM TOGGLE//////////////////////
	$('.alarm-toggle').click(function(){
		if(alarmbox){
			alarm_box.trigger('hide');
		}else{
			alarm_box.trigger('show');
		}
	});

	///////////////ALARM BUTTONS///////////////////
	$('.alarm-button').click(function(e){
		var theID = e.target.id;
		var theButton = $(this);
		activateAlarmButton(true, theButton, theID);
		if(theID == "new"){
			//find out which alarm it is
			var made_alarm = false;
			for(var i = 0; i < alarm_counter.length; i++){
				if(alarm_counter[i] == -1){
					current_alarm = i; //specify which alarm you are making 
					made_alarm = true;
					break;
				}
			}
			/////////////Change this to allow choice? ////////////
			if ( !made_alarm ){ //if you have made 3 alarms then override the oldest one
				current_alarm ++;
				if ( current_alarm > alarm_counter.length -1 ) current_alarm = 0;
				alarm_counter[current_alarm] = -1;
			}
			/////////////////////////////////////////////////////
		}
		else{
			current_alarm = parseFloat( theID );
		}
 		dialog_p.trigger('show');	 // Show the dialog	
 		clock.velocity({translateY: - h * clock_move_2}, 300);	
	});


	dialog.find('.close').click(function(){
		dialog_p.trigger('hide')
		if(alarm_counter[current_alarm] <= 0){ //if this alarm is not set
			activateAlarmButton(false, $("#" + String(current_alarm)).parent(), current_alarm); //deactivate it 
		}
	});


	dialog_p.click(function(e){
		// When the overlay is clicked, hide the dialog_p.
		if($(e.target).is('.overlay')){
			// This check is need to prevent
			// bubbled up events from hiding the dialog
			dialog_p.trigger('hide');
		}
	});


	alarm_set.click(function(){
		var valid = true, after = 0,
			to_seconds = [3600, 60, 1];

		dialog.find('input').each(function(i){

			// Using the validity property in HTML5-enabled browsers:

			if(this.validity && !this.validity.valid){

				// The input field contains something other than a digit,
				// or a number less than the min value

				valid = false;
				this.focus();

				return false;
			}

			after += to_seconds[i] * parseInt(this.value);
		});

		if(!valid){
			alert('Please enter a valid number!');
			return;
		}

		if(after < 1){
			alert('Please choose a time in the future!');
			return;	
		}

		alarm_counter[current_alarm] = after;
		dialog_p.trigger('hide');
	});


	alarm_clear.click(function(){
		alarm_counter[current_alarm] = -1; //reset alarm
		dialog_p.trigger('hide');
		//find the id matching the current alarm and remove active from its parent object
		activateAlarmButton(false, $("#" + String(current_alarm)).parent(), current_alarm);
	});


	time_is_up.click(function(){
		time_is_up_p.fadeOut();
		activateAlarmButton(false, $('#' + String(current_alarm)).parent(), current_alarm);
		if(alarmbox){
			clock.velocity({translateY: - h * clock_move_1}, 300);
		}
		else{
			clock.velocity({translateY: 0}, 300);
		}
	});


	////////////TOUCH EVENTS///////////////////
	//NOT WORKING!!!!!!
	$('body').on("swipeup", function(){
		if(alarmbox) alarm_box.trigger('hide');
	});

	$('body').on("swipedown", function(){
		if(!alarmbox) alarm_box.trigger('show');
	});

	$('.alarm_button').on("swipeleft", function(e){
		console.log("swippppy");
		var theID = e.target.id;
		var theButton = $(this);
		alarm_counter[theID] = -1; //reset alarm
		//deactivate the alarm
		activateAlarmButton(false, theButton, theID);
		//move like a swipe
		theButton
				.velocity({translateX: 50}, 100)
				.velocity({translateX: 0}, 300);
	});

	

	//////////////HIDE AND SHOW//////////////////////
	dialog_p.on('hide',function(){
		alarm_box.trigger('hide');
		dialog_p.fadeOut();

	}).on('show',function(){

		// Calculate how much time is left for the alarm to go off.
		var hours = 0, minutes = 0, seconds = 0;

		if(alarm_counter[current_alarm] > 0){
			
			// There is an alarm set, calculate the remaining time
			var time_left = breakTime(alarm_counter[current_alarm]);
			hours = time_left[0];
			minutes = time_left[1];
			seconds = time_left[2];
		}

		// Update the input fields
		dialog_p.find('input').eq(0).val(hours).end().eq(1).val(minutes).end().eq(2).val(seconds);

		dialog_p.fadeIn();

	});


	alarm_box.on('hide',function(){
		alarm_box.velocity({translateY: 0}, 300, function(){
			alarmbox = false;
		});
		setTimeout(function(){
				clock.velocity({translateY: 0}, 300);
		}, 100);
	}).on('show',function(){
		alarm_box.velocity({translateY: -toggle_move}, 300, function(){
			alarmbox = true;
		});
		setTimeout(function(){
				clock.velocity({translateY: - h * clock_move_1}, 300);
		}, 75);
	});
});