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
material_glossy(vec4 albedo)
{
    float cos_alpha = - dot(attr_normal, ray_dir);

    vec3 z = ray_dir + attr_normal * (2.0 * cos_alpha);

    mat3 tbn = generate_basis(z);

    float r1 = 2.0 * MATH_PI * random();
    float r2 = pow(random(), albedo.w) * cos_alpha * cos_alpha;
    float r2s = sqrt(r2);

    vec3 new_ray_dir = tbn * vec3(cos(r1) * r2s, sin(r1) * r2s, sqrt(1.0 - r2));

    ray_color = albedo.xyz;
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
    hardness = mongoengine.FloatField(default=2.0)

    @property
    def vec4(self):
        return [self.albedo[0], self.albedo[1], self.albedo[2], self.hardness]

    def code(self):
        code_tmplt = "material_glossy({albedo});"

        return code_tmplt.format(
            albedo=utils.code_vec(self.vec4)
        )
