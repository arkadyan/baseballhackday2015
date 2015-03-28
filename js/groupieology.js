$(function() {
	var Groupieology = Groupieology || {};

	Groupieology.Performer = Backbone.Model.extend({

	});

	Groupieology.Event = Backbone.Model.extend({

	});

	Groupieology.Venue = Backbone.Model.extend({

	});

	Groupieology.Events = Backbone.Collection.extend({
		model: Groupieology.Event,
		parse: function(data) {
			var events = [];
			if (typeof data.events !== 'undefined') {
				$.each(data.events, function(i,v) {
					events.push(v);
				});
			}
			return events;
		},
		fetch: function(options) {
			options = options || {};
			options.dataType = 'json';
			options.url = 'http://api.seatgeek.com/2/events?performers.id=' + this.searchKey;

			/* fetch the data */
			return Backbone.Collection.prototype.fetch.call(this, options);
		},
		setSearchKey: function(key) {
			this.searchKey = key;
		}
	});

	Groupieology.Performers = Backbone.Collection.extend({
		model: Groupieology.Performer,
		parse: function(data) {
			var performers = [];
			if (typeof data.performers !== 'undefined') {
				$.each(data.performers, function(i,v) {
					performers.push(v);
				});
			}
			return performers;
		},
		fetch: function(options) {
			options = options || {};
			options.dataType = 'json';
			options.url = 'http://api.seatgeek.com/2/performers?type=mlb&id=' + this.artistId;

			/* fetch the data */
			return Backbone.Collection.prototype.fetch.call(this, options);
		},
		setArtistId: function(id) {
			this.artistId = id;
		}
	});

	Groupieology.PerformerView = Backbone.View.extend({
		tagName: 'div',
		className: 'performer',
		template: _.template($('#search-result-template').html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});

	Groupieology.PerformerDetailView = Backbone.View.extend({
		tagName: 'div',
		className: 'performer-detail',
		template: _.template($('#performer-template').html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});


	Groupieology.EventsView = Backbone.View.extend({
		render: function() {
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

			var markers = Array();
			var infoWindows = Array();

			if (this.model !== 'undefined') {
				/* assume an events collection */
				this.model.each(function(artistEvent) {
					locations.push({
						name: artistEvent.get('venue').name,
						latlng: new google.maps.LatLng(artistEvent.get('venue').location.lat, artistEvent.get('venue').location.lon)
					});
				});
			}

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

				google.maps.event.addListener(marker, 'click', function() {
					infoWindows[this.infoWindowIndex].open(map, this);
				});

				infoWindows.push(infoWindow);
				path.push(locations[i].latlng);
				latlngbounds.extend(locations[i].latlng);
			}

			map.fitBounds(latlngbounds);
		}
	});


	Groupieology.AppView = Backbone.View.extend({
		el: '#groupiology-app',
		events: {
			'change #search' : 'search'
		},
		initialize : function() {
			/* set up a listener function to update the search results div when the
			 * Performers collection has changed */
			this.listenTo(Groupieology.performers, 'add', function(performer) {
				/* create a new performer view */
				var view = new Groupieology.PerformerView({ model: performer });

				/* append it to the search list */
        // this.$('#content').append(view.render().el);
			});

			this.listenTo(Groupieology.events, 'sync', function() {
				var view = new Groupieology.EventsView({
					model: Groupieology.events
				});

				view.render();

				/* find the performer clicked */
				var currentArtist = new Groupieology.Performer(
					Groupieology.performers.findWhere({ id: Groupieology.currentArtist})
				);
				var performerView =
					new Groupieology.PerformerDetailView({
						model: currentArtist.attributes
					});
					this.$('#content').append(performerView.render().el);

			});
		},
		search : function(event) {
			/* get the performer term */
			var teamId = $('select[id="search"]').val();
      window.location = '#/artist/' + teamId;

			Groupieology.performers.setArtistId(teamId);
			Groupieology.performers.fetch();
		}
	});

	Groupieology.Router = Backbone.Router.extend({
		routes: {
			'artist/:id': 'showArtistMap'
		},

		showArtistMap: function(id) {
			/* get the events for an artist */
			Groupieology.events = Groupieology.events || new Groupieology.Events();
			Groupieology.events.setSearchKey(id);
			$('#content').empty();
			Groupieology.events.fetch();
			Groupieology.currentArtist = parseInt(id, 10);
      $('#search').val(id);
		}
	});


	Groupieology.performers = new Groupieology.Performers();
	Groupieology.events = new Groupieology.Events();
	Groupieology.router = new Groupieology.Router();
	Backbone.history.start();
	Groupieology.app = new Groupieology.AppView();
});
