#include <iostream>
#include "dispatch.h"

int main(int argc, char* argv[]) {
    if (argc < 4 || !((std::string(argv[1]) == "list" && argc == 4)
        || (std::string(argv[1]) == "respond" && (argc == 6 || argc == 7)))) {
        std::cerr << "Usage: dispatch list ALERTS RESPONSES\n"
                  << "       dispatch respond ALERTS RESPONSES ALERT_ID ACTION [NOTE]\n";
        return 2;
    }
    try {
        // Never append responses to the sensor's alert log, including through a symlink.
        if (std::filesystem::weakly_canonical(argv[2]) == std::filesystem::weakly_canonical(argv[3])
            || (std::filesystem::exists(argv[3]) && std::filesystem::equivalent(argv[2], argv[3])))
            throw std::runtime_error("Alert and response files must be different");
        coldchain::JsonlResponseRepository repository(argv[3]);
        coldchain::DispatchService service(argv[2], repository);
        if (std::string(argv[1]) == "respond") service.respond(argv[4], argv[5], argc == 7 ? argv[6] : "");
        auto result = service.list();
        std::cout << json_object_to_json_string_ext(result.get(), JSON_C_TO_STRING_PRETTY) << '\n';
    } catch (const std::exception& error) {
        std::cerr << "Dispatch error: " << error.what() << '\n';
        return 1;
    }
}
