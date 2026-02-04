/**
 * Скрипт для автоматической очистки перед установкой
 * Выполняется перед npm run android
 */

const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

function runCommand(command, ignoreError = false) {
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      shell: isWindows ? 'cmd.exe' : '/bin/bash'
    });
    return output.trim();
  } catch (error) {
    if (!ignoreError) {
      console.error(`Ошибка выполнения команды: ${command}`);
      console.error(error.message);
    }
    return null;
  }
}

function checkDevice() {
  console.log('🔍 Проверка подключения эмулятора...');
  const devices = runCommand('adb devices');
  
  if (!devices || !devices.includes('device')) {
    console.log('⚠️  Эмулятор не подключен. Пропускаем очистку.');
    console.log('💡 Запустите эмулятор и используйте: npm run android:clean');
    return false;
  }
  
  return true;
}

function cleanApp() {
  console.log('🧹 Начало автоматической очистки...\n');
  
  if (!checkDevice()) {
    return;
  }
  
  console.log('📦 Удаление старого приложения...');
  runCommand('adb uninstall com.scanimg', true);
  
  console.log('🗑️  Очистка кеша приложения...');
  runCommand('adb shell pm clear com.scanimg', true);
  
  console.log('🧽 Очистка временных файлов...');
  runCommand('adb shell rm -rf /data/local/tmp/*.apk', true);
  runCommand('adb shell rm -rf /data/local/tmp/*', true);
  
  console.log('💾 Проверка свободного места...');
  const storage = runCommand('adb shell df -h /data');
  if (storage) {
    const lines = storage.split('\n').filter(line => line.includes('/data'));
    if (lines.length > 0) {
      console.log(`   ${lines[0]}`);
    }
  }
  
  console.log('\n✅ Очистка завершена. Продолжаем установку...\n');
}

// Запускаем очистку
cleanApp();
