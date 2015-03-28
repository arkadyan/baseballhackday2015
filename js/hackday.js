$(function() {
	var Hackday = Hackday || {};
	Hackday.Team = Backbone.Model.extend({
		initialize: function() {
			this.events = [];
		},
		fetch: function(options) {
			options = options || {};
			options.dataType = 'json';
			options.url = 'http://api.seatgeek.com/2/events?performers.id=' + this.get('team');
			
			/* fetch the data */
			return Backbone.Model.prototype.fetch.call(this, options);
		},
		parse: function(data) {
			this.events = [];
			var events = this.events;
			if (typeof data.events !== 'undefined') {
				$.each(data.events, function(i,v) {
					events.push(v);
				});
			}
			return this;
		}
	});
	
	Hackday.TeamView = Backbone.View.extend({
		tagName: 'div',
		template: _.template($('#event-template').html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	Hackday.Event = Backbone.Model.extend({});
	Hackday.Events = Backbone.Collection.extend({
		model: Hackday.event
	});
	
	Hackday.AppView = Backbone.View.extend({
		el: '#hackday-app',
		events: {
			'change #teams': 'getEventsForTeam',
			'click #mapit': 'mapIt'
		},
		getEventsForTeam: function() {
			var team = $('select[id="teams"]').val();
			
			/* update the model */
			Hackday.team.set('team', team);
			Hackday.team.fetch().success(function() {
				$('#content').empty();
				var view = new Hackday.TeamView({
					model: Hackday.team
				});

				$('#content').append(view.render().el);
			});
		},
		mapIt: function() {
			/* get the selected elements */
			var selected = $('#content').find('input:checked');
			
			/* build up the event array to map */
			var eventsToMap = [];
			$.each(selected, function() {
				/* find the event with this id from the team */
				var id = Number($(this).attr('id'));
				var event = _.find(Hackday.team.events, function(item) {
					if ( item.id === id ) {
						return true;
					}
					return false;
				});
				if (typeof event !== 'undefined') {
					eventsToMap.push(event);
				}
			});
			
			var locations = [];
			var mapHolder = document.getElementById('event-map');
			var mapOptions = {
				zoom: 0,
				center: new google.maps.LatLng(0, 0),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			var polyOptions = {
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 4
			};

			var map = new google.maps.Map(mapHolder, mapOptions);

			var poly = new google.maps.Polyline(polyOptions);
			poly.setMap(map);

			var path = poly.getPath();
			var latlngbounds = new google.maps.LatLngBounds();
			var infoWindows = Array();

			/* loop through the events and map */
			$.each(eventsToMap, function() {
				var event = this;
				locations.push({
					name: event.venue.name,
					latlng: new google.maps.LatLng(event.venue.location.lat, event.venue.location.lon)
				});
			});
			for (var i = 0; i < locations.length; i++) {
				var marker = new google.maps.Marker( {
					position: locations[i].latlng,
					map: map,
					title: locations[i].name,
					infoWindowIndex: i
				});

				var infoWindow = new google.maps.InfoWindow({
					content: marker.title
				});

				/*
				google.maps.event.addListener(marker, 'click', function() {
					infoWindows[this.infoWindowIndex].open(map, this);
				});
				*/

				infoWindows.push(infoWindow);
				path.push(locations[i].latlng);
				latlngbounds.extend(locations[i].latlng);
			}

			map.fitBounds(latlngbounds);
		}
	});
	
	Hackday.team = new Hackday.Team();
	Hackday.events = new Hackday.Events();
	Hackday.app = new Hackday.AppView();
});