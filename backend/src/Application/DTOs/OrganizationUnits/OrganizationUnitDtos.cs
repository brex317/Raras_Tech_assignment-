namespace Application.DTOs.OrganizationUnits;

public class OrganizationUnitDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? ParentId { get; set; }
    public string? ParentName { get; set; }
    public int Level { get; set; }
    public int AssetCount { get; set; }
}

public class OrganizationUnitTreeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int Level { get; set; }
    public int AssetCount { get; set; }
    public List<OrganizationUnitTreeDto> Children { get; set; } = new();
}

public class CreateOrganizationUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}

public class UpdateOrganizationUnitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? ParentId { get; set; }
}
