var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 29228,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df256fea4154121c%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff178d3fad2d524%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557628694789,
                "type": ""
            }
        ],
        "screenShotFile": "00800004-003e-0048-00e4-001a007c0005.png",
        "timestamp": 1557628688148,
        "duration": 35000
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 25808,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: baseUrl is not defined"
        ],
        "trace": [
            "ReferenceError: baseUrl is not defined\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:23)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ad00e6-00d5-0064-00d0-0083008d007e.png",
        "timestamp": 1557629001467,
        "duration": 1163
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 20140,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: expect(...).toContains is not a function"
        ],
        "trace": [
            "TypeError: expect(...).toContains is not a function\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:106:48)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "007e007d-0028-003c-00b1-002b009200a9.png",
        "timestamp": 1557629122203,
        "duration": 1237
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 23536,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: Não localizado campo busca produto\nWait timed out after 5011ms"
        ],
        "trace": [
            "TimeoutError: Não localizado campo busca produto\nWait timed out after 5011ms\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: Não localizado campo busca produto\n    at scheduleWait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:59:33)\n    at ProtractorBrowser.to.(anonymous function) [as wait] (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:67:16)\n    at Object.waitForElementVisibility (C:\\projetoProtractor\\node_modules\\protractor-helper\\src\\waiters.js:30:11)\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:64:22)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00900022-0011-001a-0080-00f700e50044.png",
        "timestamp": 1557629182779,
        "duration": 6247
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24020,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Expected 'Your order on My Store is complete.' to contain 'Your order on My Store is complete.tt'."
        ],
        "trace": [
            "Error: Failed expectation\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:106:48)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df2234b9f5a89f78%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Fff09b2be20e984%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557629250077,
                "type": ""
            }
        ],
        "screenShotFile": "00100091-00bb-00f3-0002-004600d900e6.png",
        "timestamp": 1557629244359,
        "duration": 33395
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 30300,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df149d3b861953ec%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff2a90f4290071b8%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557630804189,
                "type": ""
            }
        ],
        "screenShotFile": "0096009f-00e6-007d-0089-00e800a70044.png",
        "timestamp": 1557630794665,
        "duration": 38559
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 29380,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df3e9d655a2d12e8%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff329f8395fce16c%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557630913920,
                "type": ""
            }
        ],
        "screenShotFile": "009f00d3-0001-008d-00dd-005e00fb004a.png",
        "timestamp": 1557630897582,
        "duration": 45267
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "instanceId": 20604,
        "browser": {
            "name": "firefox"
        },
        "message": [
            "Failed: element with locator 'By(css selector, .button.lnk_view)' is not clickable. Possibly it's not present or visible, or it may be disabled.\nWait timed out after 5025ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(css selector, .button.lnk_view)' is not clickable. Possibly it's not present or visible, or it may be disabled.\nWait timed out after 5025ms\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: element with locator 'By(css selector, .button.lnk_view)' is not clickable. Possibly it's not present or visible, or it may be disabled.\n    at scheduleWait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:59:33)\n    at ProtractorBrowser.to.(anonymous function) [as wait] (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:67:16)\n    at Object.waitForElementToBeClickable (C:\\projetoProtractor\\node_modules\\protractor-helper\\src\\constants_and_utils\\utils.js:18:11)\n    at Object.clickWhenClickable (C:\\projetoProtractor\\node_modules\\protractor-helper\\src\\clickersAndTappers.js:12:9)\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:68:22)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "0074003b-008e-0004-0010-00de00fa00a2.png",
        "timestamp": 1557631097309,
        "duration": 23199
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 30132,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: buttonAddToCart is not defined"
        ],
        "trace": [
            "ReferenceError: buttonAddToCart is not defined\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:23:41)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "00010050-0050-0039-0076-00fc00ce00e0.png",
        "timestamp": 1557632470186,
        "duration": 1227
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 13156,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df5b8528fbf8cf8%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff76326828afab%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557632526023,
                "type": ""
            }
        ],
        "screenShotFile": "006e0001-0007-00fe-0047-0063000000ec.png",
        "timestamp": 1557632519550,
        "duration": 6981
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 27268,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": [
            "Failed: element with locator 'By(css selector, #add_to_cart button[name='Submit'])' is not clickable. Possibly it's not present or visible, or it may be disabled.\nWait timed out after 10001ms"
        ],
        "trace": [
            "TimeoutError: element with locator 'By(css selector, #add_to_cart button[name='Submit'])' is not clickable. Possibly it's not present or visible, or it may be disabled.\nWait timed out after 10001ms\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2201:17\n    at ManagedPromise.invokeCallback_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:188:7)\nFrom: Task: element with locator 'By(css selector, #add_to_cart button[name='Submit'])' is not clickable. Possibly it's not present or visible, or it may be disabled.\n    at scheduleWait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2188:20)\n    at ControlFlow.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2517:12)\n    at Driver.wait (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:934:29)\n    at run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:59:33)\n    at ProtractorBrowser.to.(anonymous function) [as wait] (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:67:16)\n    at Object.waitForElementToBeClickable (C:\\projetoProtractor\\node_modules\\protractor-helper\\src\\constants_and_utils\\utils.js:18:11)\n    at Object.clickWhenClickable (C:\\projetoProtractor\\node_modules\\protractor-helper\\src\\clickersAndTappers.js:12:9)\n    at homePage.orderFlow (C:\\projetoProtractor\\pages\\homePage.js:23:22)\n    at UserContext.it (C:\\projetoProtractor\\specs\\orderFlow.js:13:13)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\nFrom: Task: Run it(\"Efetuar pedido com boleto cadastrando novo cliente\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (C:\\projetoProtractor\\specs\\orderFlow.js:11:2)\n    at addSpecsToSuite (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\romulo.silva\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\projetoProtractor\\specs\\orderFlow.js:6:1)\n    at Module._compile (module.js:652:30)\n    at Object.Module._extensions..js (module.js:663:10)\n    at Module.load (module.js:565:32)\n    at tryModuleLoad (module.js:505:12)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Dfbf895751cc7c%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff3fb52c69bfb0c%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557632707429,
                "type": ""
            }
        ],
        "screenShotFile": "00ec0093-0092-0002-00fa-008d001300db.png",
        "timestamp": 1557632701811,
        "duration": 18006
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 26008,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df351589a461a84%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff32f84e623f04d8%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557632777116,
                "type": ""
            }
        ],
        "screenShotFile": "009c0032-00aa-0022-0037-007a006200db.png",
        "timestamp": 1557632771588,
        "duration": 10468
    },
    {
        "description": "Efetuar pedido com boleto cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 25316,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df2e6b6fe6872454%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff371112b56ad0a8%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557633041256,
                "type": ""
            }
        ],
        "screenShotFile": "0069001b-0042-0043-005e-006500280012.png",
        "timestamp": 1557633035745,
        "duration": 10430
    },
    {
        "description": "Efetuar pedido com pagamento bancário cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 26704,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df368982cd19205%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff1fff02b2f02c1c%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557634441229,
                "type": ""
            }
        ],
        "screenShotFile": "00c100aa-00ab-00b1-00ea-003b00f600f1.png",
        "timestamp": 1557634435703,
        "duration": 31757
    },
    {
        "description": "Efetuar pedido com pagamento bancário cadastrando novo cliente|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24752,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df19b6dba85a4ef%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff372b804d26f824%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557705008751,
                "type": ""
            }
        ],
        "screenShotFile": "00de00bc-0057-005b-0000-004000a900ee.png",
        "timestamp": 1557705000967,
        "duration": 36924
    },
    {
        "description": "Dado que estou na home page|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24076,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://automationpractice.com/index.php? - Refused to display 'https://www.facebook.com/connect/ping?client_id=334341610034299&domain=automationpractice.com&origin=1&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fconnect%2Fxd_arbiter%2Fr%2Fd_vbiawPdxB.js%3Fversion%3D44%23cb%3Df281012416f3498%26domain%3Dautomationpractice.com%26origin%3Dhttp%253A%252F%252Fautomationpractice.com%252Ff2d29acbfedc52%26relation%3Dparent&response_type=token%2Csigned_request&sdk=joey' in a frame because it set 'X-Frame-Options' to 'deny'.",
                "timestamp": 1557716271563,
                "type": ""
            }
        ],
        "screenShotFile": "008c00d0-002a-00cd-0044-0037002400f9.png",
        "timestamp": 1557716263614,
        "duration": 9126
    },
    {
        "description": "Quando eu seleciono um produto e realizado um novo cadastro e prosigo até o checkout|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24076,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "00b10024-00dd-0004-004c-00ee00e5008b.png",
        "timestamp": 1557716273361,
        "duration": 28319
    },
    {
        "description": "Enão eu visualizo a mensagem Your order on My Store is complete.|Cenários de fluxo de pedido",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 24076,
        "browser": {
            "name": "chrome",
            "version": "73.0.3683.103"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "004800a4-00c5-006e-00b1-002c00c7005d.png",
        "timestamp": 1557716302132,
        "duration": 120
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

