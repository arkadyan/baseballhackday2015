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
			'change #teams': 'getEventsForTeam'
		},
		getEventsForTeam: function(event) {
			var team = $('select[id="teams"]').val();
			
			/* update the model */
			Hackday.team.set('team', team);
			Hackday.team.fetch().success(function(data) {
				$('#content').empty();
				var view = new Hackday.TeamView({
					model: Hackday.team
				});

				$('#content').append(view.render().el);
			});;
		}
	});
	
	Hackday.team = new Hackday.Team();
	Hackday.events = new Hackday.Events();
	Hackday.app = new Hackday.AppView();
});