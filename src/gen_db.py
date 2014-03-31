#!/usr/bin/env python
# -*- coding: utf-8 -*-

import mongoengine

import config
from model.user import User
from glsl.scene import Rendering, boiler_scene, pyramide_scene

def gen_db():
    # DB init
    db = mongoengine.connect(config.db_name)
    db.drop_database(config.db_name)
    print '. Dropped database'

    dummy = User.new_user('ahmed.kachkach@gmail.com', 'ahmed.kachkach', 'ahmed.kachkach')
    dummy.save()

    # GLSL init
    glsl_scene = boiler_scene(dummy, title="Dummy Scene", description="Just a random dummy scene")
    glsl_scene.save()

    another_glsl_scene = boiler_scene(dummy, title="Another Dummy Scene", description="And here you go : yet another dummy scene.")
    another_glsl_scene.save()

    pyramideScene = pyramide_scene(dummy, title="Pyramide", description="Pyramide of balls")
    pyramideScene.save()

    #Rendering.create(width=1000, height=600, samples=16, scene=glsl_scene).save()
    Rendering.create(width=1366, height=768, samples=64, scene=another_glsl_scene, max_iterations=5).save()
    Rendering.create(width=1366, height=768, samples=128, scene=pyramideScene, max_iterations=5).save()

    print '. Generated dummy data !'

if __name__ == '__main__':
    gen_db()
