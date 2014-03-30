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

struct
Fresnel {
    float reflectionCoefficient;
    float transmissionCoefficient;
};

Fresnel
calculateFresnel(vec3 normal, vec3 incident, float incidentIOR, float transmittedIOR) {

    Fresnel fresnel;

    incident = normalize(incident);
    normal = normalize(normal);

    if (incidentIOR <= 0.0 && transmittedIOR <= 0.0 ) {
        fresnel.reflectionCoefficient = 1.0;
        fresnel.transmissionCoefficient = 0.0;
        return fresnel;
    } else{
        float cosThetaI = abs(dot(normal, incident));
        float sinIncidence = sqrt(1.0-pow(cosThetaI,2.0));
        float cosThetaT = sqrt(1.0-pow(((incidentIOR/transmittedIOR)*sinIncidence),2.0));
        float RsP = pow( (incidentIOR * cosThetaI - transmittedIOR * cosThetaT) / (incidentIOR * cosThetaI + transmittedIOR * cosThetaT) , 2.0);
        float RpP = pow( (incidentIOR * cosThetaT - transmittedIOR * cosThetaI) / (incidentIOR * cosThetaT + transmittedIOR * cosThetaI) , 2.0);
        fresnel.reflectionCoefficient = (RsP + RpP) / 2.0;
        fresnel.transmissionCoefficient = 1.0 - fresnel.reflectionCoefficient;
        return fresnel;
    }
}

vec3
calculateTransmissionDirection(vec3 normal, vec3 incident, float incidentIOR, float transmittedIOR) {

    float dotValue = dot(normal, -incident);

    float eta = incidentIOR / transmittedIOR;//eta

    float k = 1.0 - pow(eta, 2.0) * (1.0 - pow(dotValue, 2.0));

    if(k < 0.0) {
        return vec3(0.0); //calculateReflectionDirection(normal,incident);
    }
    else {
        return normalize((incident) * eta + normal * (eta * dotValue - sqrt(k)));
    }
}


void
material_transparent_front(vec3 albedo, float refractFactor)
{
    Fresnel fresnel = calculateFresnel(attr_normal, ray_dir, 1.0 - refractFactor, refractFactor);

    float russian_roulette = noise1D(attr_normal.x); //snoise(attr_normal);

    if(russian_roulette < fresnel.transmissionCoefficient)
    {
        ray_color = albedo;
        vec3 refl_ray_dir = reflect(ray_dir, attr_normal); //ray_dir - attr_normal * 2 * attr_normal * ray_dir;
        ray_continue(refl_ray_dir);
        return;
    }
    else
    {
        //vec3 new_ray_dir = calculateTransmissionDirection(attr_normal, ray_dir, 0.2, 0.8);//1.0 - refractFactor, refractFactor);
        vec3 new_ray_dir = ray_dir;
        ray_color = albedo;
        ray_continue(new_ray_dir);
        return;
    }
}

void
material_transparent_back(vec3 albedo, float refractFactor)
{
    // TODO
    ray_color = albedo;
    ray_continue(ray_dir);
}

void
material_transparent(vec3 albedo, float refractFactor)
{
    material_transparent_front(albedo, refractFactor);
    return;

    if(dot(attr_normal, ray_dir) < 0.0) // Ray from outside
    {
        material_transparent_front(albedo, refractFactor);
    }
    else // Ray from inside
    {
        material_transparent_back(albedo, refractFactor);
    }
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


# ------------------------------------------------------------------------------ TRANSPARENT MATERIAL

class Transparent(Abstract):

    albedo = mongoengine.ListField(mongoengine.FloatField(), default=lambda : [0.8, 0.8, 0.8])
    refract_factor = mongoengine.FloatField(0.6)

    def code(self):
        code_tmplt = "material_transparent({albedo}, {refract_factor});"

        print self.refract_factor

        return code_tmplt.format(
            albedo=utils.code_vec(self.albedo),
            refract_factor=self.refract_factor,
        )
