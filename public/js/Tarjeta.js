
const tarjeta =document.querySelector('#tarjeta'),
        btnAbrirFormulario = document.querySelector('#btn-abrir-formulario'),
        formulario = document.querySelector('#formulario-tarjeta'),
        numeroTarjeta = document.querySelector('#tarjeta .numero'),
        nombreTarjeta = document.querySelector('#tarjeta .nombre'),
        logoMarca = document.querySelector('#logo-marca'),
        firma=document.querySelector('#tarjeta .firma p'),
        mesExpiracion=document.querySelector('#tarjeta .mes'),
        yearExpracion=document.querySelector('#tarjeta .year'),
        ccv=document.querySelector('#tarjeta .ccv');

// Rotacion de la tarjeta

tarjeta.addEventListener('click', () => {
    tarjeta.classList.toggle('active');
});

// Abrir y cerrar el formulario de tarjeta
btnAbrirFormulario.addEventListener('click', () => {
   btnAbrirFormulario.classList.toggle('active');
   formulario.classList.toggle('active');
   
});

// Rellenar el select del mes
for (let i = 1; i<=12; i++){
    console.log(i);
    let opcion = document.createElement('option');
    opcion.value = i;
    opcion.innerText = i;
    formulario.selectMes.appendChild(opcion);
}
// Rellenar el select del año
const yearActual = new Date().getFullYear();
for (let i = yearActual; i<= yearActual + 8; i++){
    console.log(i);
    let opcion = document.createElement('option');
    opcion.value = i;
    opcion.innerText = i;
    formulario.selectYear.appendChild(opcion);
}


//Validation de rotacion o lado de tarjeta
const mostrarFrente = () => {
    if(tarjeta.classList.contains('active')){
        tarjeta.classList.remove('active');
    }
}
// Numero de la tarjeta

formulario.inputNumero.addEventListener('keyup', (e) =>{
    let valorInput = e.target.value; 
    formulario.inputNumero.value = valorInput
    .replace(/\s/g, '')
    //Eliminar las letras 
    .replace(/\D/g, '')
    // Espacio cada 4 numeros
    .replace(/([0-9]{4})/g, '$1 ')
    // Eliminar espacio al final
    .trim();
    
    numeroTarjeta.textContent = valorInput;

    if(valorInput==''){
        numeroTarjeta.textContent = '#### #### #### ####';
        logoMarca.innerHTML = '';
    }

    if(valorInput[0] == 4){
        logoMarca .innerHTML = '';
        const imagen =document.createElement('img');
        imagen.src = '/Frontend/Public/img/formulario/visa.png';
        logoMarca.appendChild(imagen);
    }else if(valorInput[0] == 5){
        logoMarca .innerHTML = '';
        const imagen = document.createElement('img');
        imagen.src = '/Frontend/Public/img/formulario/mastercard.png';
        logoMarca.appendChild(imagen);
    }

    //Voltear tarjeta si esta alreves
    mostrarFrente();

});

// Nombre de la tarjeta

formulario.inputNombre.addEventListener('keyup', (e) =>{
    let valorInput = e.target.value;
    formulario.inputNombre.value = valorInput.replace(/[0-9]/g, '');
    nombreTarjeta.textContent = valorInput;
    firma.textContent = valorInput;

    if (valorInput == ''){
        nombreTarjeta.textContent = 'Jhon Doe';
    }

    mostrarFrente();
});

// mes de la tarjeta

formulario.selectMes.addEventListener('change', (e) =>{
    mesExpiracion.textContent = e.target.value;

    mostrarFrente();
});

// año de la tarjeta

formulario.selectYear.addEventListener('change', (e) =>{
    yearExpracion.textContent = e.target.value.slice(2);

    mostrarFrente();
});

// CCV de la tarjeta

formulario.inputCCV.addEventListener('keyup', (e) =>{
    if(!tarjeta.classList.contains('active')){
        tarjeta.classList.toggle('active');
    }

    let valorInput = e.target.value;
    formulario.inputCCV.value = formulario.inputCCV.value
    .replace(/\s/g, '')
    //Eliminar las letras 
    .replace(/\D/g, '');


    if(valorInput == ''){
        ccv.textContent = '***';
    }

    ccv.textContent =  formulario.inputCCV.value;

});
