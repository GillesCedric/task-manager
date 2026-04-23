<?php

declare(strict_types=1);

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

/**
 * @class Kernel
 * @description Noyau de l'application Symfony 7.4.
 * MicroKernelTrait lit automatiquement config/packages/, config/routes/
 * et config/services.yaml — aucune configuration manuelle nécessaire.
 *
 * @author Gilles Cédric <nguefackgilles@gmail.com>
 * @since  1.0.0
 */
class Kernel extends BaseKernel
{
    use MicroKernelTrait;
}
