import mongoengine

import utils


# ------------------------------------------------------------------------------ GLSL MATERIAL CODE

glsl_code = """

void
material_albedo(vec3 albedo)
{
    mat3 tbn = generate_basis(attr_normal);
    vec3 half_sphere = random_half_sphere();

    vec3 new_ray_dir = tbn * half_sphere;

    ray_color = albedo;

    ray_continue(new_ray_dir);
}

void
material_mirror(vec3 albedo)
{
    vec3 new_ray_dir = reflect(ray_dir, attr_normal);
    ray_color = albedo;
    ray_continue(new_ray_dir);
}

void
material_glossy(vec3 albedo)
{
    vec3 light_ray = reflect(ray_dir, attr_normal);
    vec3 reflected_light = normalize(reflect(light_ray, attr_normal));
    float specularHighlight = max(0.0, dot(reflected_light, ray_dir));
    vec3 half_sphere = random_half_sphere() * 0.1;
    vec3 new_ray_dir = reflect(ray_dir, attr_normal) + half_sphere;
    ray_color = albedo * specularHighlight;
    ray_continue(new_ray_dir);
}

void
material_translucent(vec3 albedo)
{

}

"""


# ------------------------------------------------------------------------------ ABSTRACT CLASS

class Abstract(mongoengine.Document):

    meta = {'allow_inheritance': True}

    def code(self):
        assert False


# ------------------------------------------------------------------------------ EMIT MATERIAL

class Emit(Abstract):

    color = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.8, 0.8, 0.8])

    def code(self):
        code_tmplt = "ray_color = {color};"

        return code_tmplt.format(
            color=utils.code_vec(self.color)
        )

# ------------------------------------------------------------------------------ DIFFUSE MATERIAL

class Diffuse(Abstract):

    albedo = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.8, 0.8, 0.8])

    def code(self):
        code_tmplt = "material_albedo({albedo});"

        return code_tmplt.format(
            albedo=utils.code_vec(self.albedo)
        )

# ------------------------------------------------------------------------------ MIRROR MATERIAL

class Mirror(Abstract):

    albedo = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.8, 0.8, 0.8])

    def code(self):
        code_tmplt = "material_mirror({albedo});"

        return code_tmplt.format(
            albedo=utils.code_vec(self.albedo)
        )

# ------------------------------------------------------------------------------ GLOSSY MATERIAL

class Glossy(Abstract):

    albedo = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.8, 0.8, 0.8])

    def code(self):
        code_tmplt = "material_glossy({albedo});"

        return code_tmplt.format(
            albedo=utils.code_vec(self.albedo)
        )

