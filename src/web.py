#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math
from functools import wraps
import json
from datetime import datetime

import mongoengine
from flask import Flask, render_template, session, request, jsonify, g, redirect
from flask.ext.socketio import SocketIO, emit, join_room


import config
from model.user import User

from glsl.scene import Rendering, Scene, Assignment

# Monkey-patching mongoengine
mongoengine.Document.to_dict = lambda d : json.loads(d.to_json())

# Connecting to the database
mongoengine.connect(config.db_name)

# Flask app
app = Flask(__name__)
app.secret_key = config.session_secret_key
socketio = SocketIO(app)

def requires_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        load_request_user()
        if g.user is None:
            return redirect('/')
        else:
            return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def load_template_user():
    if session.get('logged_in'):
        return dict(user=User.objects(email=session['logged_in']).first())
    return dict(user=None)

@app.before_request
def load_request_user():
    g.user = User.objects(email=session.get('logged_in')).first()

# Pages
@app.route("/")
def index():
    return render_template('welcome.html')

@app.route("/automatic_rendering")
@requires_login
def auto_render():
    return render_template('index.html')

@app.route("/renderings")
@requires_login
def renderings():
    renderings = Rendering.objects()
    return render_template('renderings.html', renderings=renderings)

@app.route("/profile")
@requires_login
def profile():
    scenes = Scene.objects(created_by=g.user)
    renderings = Rendering.objects(scene__in=scenes)
    return render_template('profile.html', renderings=renderings)

@app.route("/add_scene")
@requires_login
def add_scene():
    return render_template('add_scene.html')



# SocketIO
@socketio.on('connect', namespace='/rendering')
def socket_connect():
    pass

@socketio.on('get rendering', namespace='/rendering')
def socket_get_rendering(message):
    available_renderings = [r for r in Rendering.objects().order_by('-date_created')
                            if any(a.status == Assignment.UNASSIGNED for a in Assignment.objects(rendering=r))]
    if available_renderings:
        rendering_dict = available_renderings[0].to_dict()
        # rendering_dict['completion'] = rendering.completion
        emit('new rendering', dict(ok=True, result=rendering_dict))
    else:
        return emit('new rendering', dict(ok=False))

@socketio.on('get assignment', namespace='/rendering')
def socket_get_assignment(message):
    load_request_user()

    rendering = Rendering.objects.get(id=message['rendering_id'])
    assignment = rendering.get_assignment()

    if assignment:
        # Assigning to user
        assignment.status = Assignment.ASSIGNED
        assignment.assigned_to = g.user
        assignment.date = datetime.now()
        assignment.save()
        # Join a room
        join_room('rendering_{}'.format(message['rendering_id']))
        result = dict(completed=False, rendering=rendering.to_dict(), assignment=assignment.to_dict(), shader=assignment.composeGLSL())
        emit('new assignment', dict(ok=True, result=result))
    else:
        emit('new assignment', dict(ok=False, result=dict(completed=True)))

@socketio.on('assignment completed', namespace='/rendering')
def socket_assignment_completed(message):
    load_request_user()

    assignment = Assignment.objects.get(id=message['assignment_id'])
    assignment.status = Assignment.DONE
    assignment.pixels = [ord(c) for c in message['pixels']]
    assignment.save()

    completed_pixels = int(assignment.width * assignment.height)

    g.user.pixels += completed_pixels
    g.user.credits += math.sqrt(completed_pixels) / 10000000
    g.user.save()

    rendering_author = assignment.rendering_author
    rendering_author.credits = min(0, rendering_author.credits - completed_pixels)
    rendering_author.save()

    emit('incoming assignment', dict(assignment=assignment.to_dict()), room='rendering_{}'.format(assignment.rendering.id))

    return jsonify(ok=True)


@socketio.on('get previous assignments', namespace='/rendering')
def socket_previous_assignments(message):
    rendering = Rendering.objects.get(id=message['rendering_id'])
    assignments = [a.to_dict() for a in Assignment.objects(rendering=rendering, status=Assignment.DONE)]

    emit('previous assignments', dict(assignments=assignments))

    return jsonify(ok=True)

# API
@app.route("/api/rendering/<rendering_id>")
@requires_login
def api_rendering(rendering_id):
    rendering = Rendering.objects.get(id=rendering_id)
    rendering_dict = rendering.to_dict()
    # rendering_dict['completion'] = rendering.completion

    return jsonify(ok=True, result=rendering_dict)


@app.route("/api/login", methods=['POST'])
def api_connect():
    username = request.json['username'].lower().strip()
    user, created = User.objects.get_or_create(username=username)
    app.logger.info(user)
    app.logger.info(username)
    if created:
        user.email = '{}@fhacktory.com'.format(username)
        user.save()
    connect_user(user)
    return jsonify(ok=True)

@app.route("/api/logout", methods=['POST'])
def api_logout():
    session['logged_in'] = None
    return jsonify(ok=True)

def connect_user(user):
    session['logged_in'] = user.email
    load_request_user()
    load_template_user()

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000)
    # app.run('0.0.0.0', 5000, debug=True)
