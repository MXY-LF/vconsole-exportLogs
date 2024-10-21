import VConsole from 'vconsolelogs';

class MyPlugin extends VConsole.VConsolePlugin {

}

const vc = new VConsole();
vc.addPlugin(new MyPlugin);
