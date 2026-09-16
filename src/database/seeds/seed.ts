import { dataSourceDeConsola } from '../../config/data-source.js';
import {
  ROLES_DEL_SISTEMA,
  Rol as NombreDeRol,
} from '../../commons/enums/rol.enum.js';
import { hashearPassword } from '../../commons/passwords.js';
import { Rol } from '../../entities/rol.entity.js';
import { Usuario } from '../../entities/usuario.entity.js';

async function main(): Promise<void> {
  const dataSource = dataSourceDeConsola();
  await dataSource.initialize();

  try {
    const roles = dataSource.getRepository(Rol);
    const usuarios = dataSource.getRepository(Usuario);

    for (const nombre of ROLES_DEL_SISTEMA) {
      if (!(await roles.findOne({ where: { nombre } }))) {
        await roles.save(roles.create({ nombre }));
        console.log(`rol creado: ${nombre}`);
      }
    }

    const username = process.env.ADMIN_USERNAME || 'admin';
    if (await usuarios.findOne({ where: { username } })) {
      console.log(`el usuario '${username}' ya existe`);
      return;
    }

    const rolAdmin = await roles.findOneOrFail({
      where: { nombre: NombreDeRol.ADMINISTRADOR },
    });

    await usuarios.save(
      usuarios.create({
        nombre: 'Admin',
        apellido: 'Sistema',
        correo: process.env.ADMIN_CORREO || 'admin@tienda.com',
        username,
        password: await hashearPassword(
          process.env.ADMIN_PASSWORD || 'admin123',
        ),
        rol_id: rolAdmin.id,
        tipo: 'usuario',
      }),
    );

    console.log(`usuario administrador creado: ${username}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
