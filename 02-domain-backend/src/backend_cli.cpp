#include <iostream>
#include "backend.h"

int main(int argc, char* argv[]) {
    using namespace coldchain;
    using namespace coldchain::backend;
    int status = 200;
    Json body;
    try {
        if (argc < 3 || argc > 4) throw Error(400, "Usage: backend STATE_FILE COMMAND [SHIPMENT_ID]; JSON body on stdin");
        const std::string command = argv[2];
        const bool scoped = command == "readings" || command == "respond";
        const bool mutation = command == "create-shipment" || command == "add-reading" || command == "respond";
        if ((scoped && argc != 4) || (!scoped && argc != 3)) throw Error(400, "Unexpected command arguments");
        int64_t id = 0;
        if (scoped) {
            const std::string argument = argv[3];
            if (argument.empty() || argument.find_first_not_of("0123456789") != std::string::npos || argument.size() > 15)
                throw Error(400, "Invalid shipment ID");
            id = std::stoll(argument);
            if (id <= 0) throw Error(400, "Invalid shipment ID");
        }
        Json input;
        if (mutation) {
            std::string buffer;
            char chunk[4096];
            while (std::cin.read(chunk, sizeof chunk) || std::cin.gcount()) {
                buffer.append(chunk, std::cin.gcount());
                if (buffer.size() > 65536) throw Error(413, "JSON input exceeds 64 KiB");
            }
            input = parse(buffer);
        }
        FileStateRepository repository(argv[1]);
        LogisticsService service(repository);
        if (command == "shipments") body = service.shipments();
        else if (command == "create-shipment") { body = service.createShipment(input.get()); status = 201; }
        else if (command == "readings") body = service.readings(id);
        else if (command == "add-reading") { body = service.addReading(input.get()); status = 201; }
        else if (command == "alerts") body = service.alerts();
        else if (command == "respond") body = service.respond(id, input.get());
        else throw Error(400, "Unknown command");
    } catch (const Error& error) {
        status = error.status; body = own(json_object_new_object()); put(body.get(), "error", error.what());
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        status = 500; body = own(json_object_new_object()); put(body.get(), "error", "Storage or internal error");
    }
    auto envelope = own(json_object_new_object());
    put(envelope.get(), "status", static_cast<int64_t>(status));
    json_object_object_add(envelope.get(), "body", json_object_get(body.get()));
    std::cout << json_object_to_json_string_ext(envelope.get(), JSON_C_TO_STRING_PLAIN) << '\n';
    return status < 400 ? 0 : 1;
}
