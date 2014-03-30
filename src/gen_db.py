#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine

import config
from model.user import User
from glsl.scene import Rendering, boiler_scene

def gen_db():
    # DB init
    db = mongoengine.connect(config.db_name)
    db.drop_database(config.db_name)
    print '. Dropped database'

    dummy = User.new_user('ahmed.kachkach@gmail.com', 'halflings', 'password')
    dummy.save()

    # GLSL init
    glsl_scene = boiler_scene(dummy, title="Dummy Scene", description="Just a random dummy scene")
    glsl_scene.save()

    another_glsl_scene = boiler_scene(dummy, title="Another Dummy Scene", description="And here you go : yet another dummy scene.")
    another_glsl_scene.save()

    #Rendering.create(width=1000, height=600, samples=64, scene=glsl_scene).save()
    Rendering.create(width=600, height=400, samples=32, scene=another_glsl_scene).save()
    print '. Generated dummy data !'

if __name__ == '__main__':
    gen_db()
