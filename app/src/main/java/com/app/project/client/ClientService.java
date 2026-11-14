package com.app.project.client;

import com.app.project.shared.PhoneNumbers;

import java.util.ArrayList;
import java.util.List;

public class ClientService{


    private ClientRepository clientRepository;


    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }



    public ClientDto getClientById(long id) {
        
        Client client = this.clientRepository.findById(id);
        
        return client != null ? toDto(client) : null;
    }

    public List<ClientDto> getClientByName(String name) {
        
        List<Client> clients = this.clientRepository.findByName(name);
        
        if(clients == null) return null;
        
        List<ClientDto> clientsDto = new ArrayList<>(clients.size());

        for (Client client : clients) {
            clientsDto.add(toDto(client));
        }


        return clientsDto;
    
    }

    public List<ClientDto> getAllClients() {
        
        List<Client> clients = this.clientRepository.findAll();
        List<ClientDto> result = new ArrayList<>(clients.size());

        for (Client client : clients) {
            result.add(toDto(client));
        }

        return result;
    }

    public List<ClientDto> getClientsPaginated(String name, String phone, int page, int size) {
        
        List<Client> clients = new java.util.ArrayList<>();

        if (phone != null) {
            
            Client client = this.clientRepository.findByPhone(PhoneNumbers.normalizeLenient(phone));
            if (client != null) clients.add(client);
        
        } else if (name != null) {
            clients = this.clientRepository.findByNamePage(name, page, size);
        
        } else {
            clients = this.clientRepository.findPage(page, size);
        
        }

        List<ClientDto> result = new java.util.ArrayList<>(clients.size());
        for (Client client : clients) {
            result.add(toDto(client));
        }

        return result;
}

    // O telefone buscado é padronizado do mesmo jeito que o gravado, então
    // "(75) 99812-4410" encontra o cliente salvo como "75998124410".
    public ClientDto getClientByPhone(String phone) {
        
        String normalized = PhoneNumbers.normalizeLenient(phone);
        if (normalized == null) return null;

        Client client = this.clientRepository.findByPhone(normalized);
        
        return client != null ? toDto(client) : null;
    
    }

    public ClientWithSalesDto getClientWithSalesById(long id) {
        ClientWithSales pojo = this.clientRepository.findWithSalesById(id);
        
        if (pojo == null) return null;

        ClientWithSalesDto dto = new ClientWithSalesDto();
        dto.setClient(toDto(pojo.client));
        
        // Se você possuir um SaleDto no futuro, converta a lista de vendas aqui.
        // Por enquanto, repassamos a lista da entidade Sale mapeada pelo Room.
        dto.setSales(pojo.sales);
        
        return dto;
    }


    
    // Lança IllegalArgumentException (o controller responde 400) se o nome faltar ou o telefone for inválido.
    synchronized public ClientDto createClient(ClientDto clientDTO) {
        
        if (clientDTO.getName() == null || clientDTO.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("O nome é obrigatório.");
        }

        Client client = toClient(clientDTO);
        client.setName(clientDTO.getName().trim());
        client.setPhone(PhoneNumbers.normalize(clientDTO.getPhone()));
        client.setId(0);

        Client created = this.clientRepository.createClient(client);

        return created != null ? toDto(created) : null;
}

    public ClientDto updateClient(long clientId, ClientDto dto) {
        
        Client existing = this.clientRepository.findById(clientId);
        
        if (existing == null) return null;

        if (dto.getName() != null) existing.setName(dto.getName().trim());
        
        // Telefone vazio ("") apaga o telefone; qualquer outro valor é padronizado (ou dá 400 se inválido).
        if (dto.getPhone() != null) existing.setPhone(PhoneNumbers.normalize(dto.getPhone()));

        Client updated = clientRepository.updateClient(existing);
        
        return updated != null ? toDto(updated) : null;
    }

    public boolean deleteClient(long id){

        boolean removed = this.clientRepository.deleteClient(id);

        return removed;
    
    }

    
    private ClientDto toDto(Client client) {
        
        ClientDto dto = new ClientDto();
        dto.setId(client.getId());
        dto.setName(client.getName());
        dto.setPhone(client.getPhone());
        return dto;
    }

    private Client toClient(ClientDto dto) {
        
        Client newClient = new Client();

        if (dto.getId() != null) {
            
            newClient.setId(dto.getId());
        }

        newClient.setName(dto.getName());
        newClient.setPhone(dto.getPhone());
        return newClient;
    }
















}